import { randomUUID } from 'node:crypto'
import React from 'react'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { Agent, AgentHandle } from '@deepseek-ai/dsh-agent'
import UserQuestionService from '@deepseek-ai/dsh-user-questions'
import * as toolAskUser from '@deepseek-ai/dsh-tool-ask-user'
import type { Context } from '@deepseek-ai/cordis'
import { Config } from './index.js'
import { createChannel } from './channel.js'
import { QuestionStore } from './questions.js'
import { registerPackagedSkills } from './packaged-skills.js'
import { readActivityFrames } from './activityPrefs.js'
import { readModelPref } from './modelPrefs.js'
import { explicitModelRoute, resolveModelRoute, validateModelRoute } from './modelRoute.js'
import type { ModelRoute } from './modelRoute.js'
import { readPresetPref } from './presetPrefs.js'
import { composePreset, resolvePersistedPreset, runningPresetOf } from './presets.js'
import { writeResumeTarget } from './sessionHistory.js'
import { isLang, resolveStartupLang, setLang } from './i18n.js'
import { Chat } from './screens/Chat.js'
import { render, ThemeProvider, AlternateScreen } from './ui.js'

/**
 * Claude Code style interactive TUI front door for DeepSeek Harness agents.
 *
 * The plugin attaches to (or creates) one agent, renders a chat transcript
 * from the agent's session log and live `session/event` records, and submits
 * user turns through `Agent.followup`. It is a client-driver front door like
 * `dsh-jsonrpc`: the surrounding `cordis.yml` supplies the agent spine, the
 * LLM adapter, and the tool plugins.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  if (!process.stdout.isTTY) {
    throw new Error('cc-tui requires an interactive terminal (stdout must be a TTY).')
  }

  // UI language resolution: CC_TUI_LANG env var wins, then cordis.yml
  // `lang`, then the persisted `/lang` choice, then `zh`. Must settle
  // before the first render so every module resolves strings in the same
  // language.
  const envLang = process.env.CC_TUI_LANG
  setLang(isLang(envLang) ? envLang : isLang(config.lang) ? config.lang : resolveStartupLang())

  // DSH user-interaction seam: the model's ask_user_question tool parks on
  // the userInteraction service until a UI provider answers. Mount the
  // service when the composition doesn't (the official dsh-base
  // user-interaction config row does; a bare plugin mount creates it on
  // this context), expose the model-facing tool, and register this TUI's
  // questionnaire as the provider. All three must be in place before the
  // agent is resolved so the per-step tool assembly includes
  // ask_user_question. Optional-service access goes through `ctx.get`, not
  // the inject proxy.
  const userQuestions = ctx.get('userQuestions') ?? new UserQuestionService(ctx)
  ctx.plugin(toolAskUser)
  const questionStore = new QuestionStore()
  // Packaged skills (/audit, /bug, …): contribute them through the host's
  // skill registry so they resolve with zero manual copying.
  registerPackagedSkills(ctx)
  userQuestions.registerProvider({
    ask: request => questionStore.ask(request),
  })
  ctx.effect(() => () => questionStore.rejectAll())

  // Config-only route: resolveAgent applies the persisted `/model`
  // preference on CREATE only — a resumed session keeps the route its own
  // log records (last request/header), matching the preset rule.
  const configuredRoute = {
    provider: config.provider,
    model: config.model,
  }
  // Atomic route resolution (issue #67): a complete cordis.yml route wins
  // whole, else the persisted `/model` choice wins whole, else the harness
  // defaults — a provider-only config pin never merges with the persisted
  // model half. resolveAgent validates this route on create and reports the
  // one actually used, so the status line shows the real request route.
  const startupRoute = resolveModelRoute(configuredRoute, readModelPref())
  const meta = { cwd: config.cwd ?? process.cwd() }
  const { agent, handle, agentPreset, route: createdRoute } = await resolveAgent(
    ctx,
    config.sessionId,
    configuredRoute,
    startupRoute,
    meta,
    config.preset,
  )

  // Status-line route: the exact route the agent was created with; a resume
  // shows the startup resolution (the session's own records re-assert the
  // real route as they replay).
  const displayRoute = createdRoute ?? startupRoute
  const channel = createChannel(ctx, agent, {
    model: displayRoute.model,
    cwd: config.cwd ?? process.cwd(),
    provider: displayRoute.provider,
    // Raw cordis.yml route (undefined when unset): the channel's
    // new-session path re-resolves prefs against these, and resume passes
    // only explicit values so the target session's own record wins.
    configuredModel: config.model,
    configuredProvider: config.provider,
    effort: config.effort,
    activity: config.activity,
    // Explicit cordis.yml value (static deployment choice) wins over the
    // runtime `/activity` preference, which wins over the default.
    activityFrames: config.activityFrames ?? readActivityFrames() ?? 'claude',
    // Same precedence for the agent preset: cordis.yml `preset` over the
    // persisted `/preset` choice; undefined adopts the roster default.
    configuredPreset: config.preset,
    agentPreset,
    handle,
  })
  // Single exit funnel: `/exit`, double Ctrl+C, and external teardown all
  // land here. unmount() restores the terminal (cursor, raw mode, mouse
  // tracking); the explicit newlines afterwards keep the shell prompt from
  // overlapping the TUI's last line — the bare unmount left the cursor at
  // the end of the final frame, so the prompt printed over it.
  let instance: Awaited<ReturnType<typeof render>> | undefined
  let exited = false
  const handleExit = (error?: unknown): void => {
    if (exited) return
    exited = true
    try {
      writeResumeTarget(channel.agentId)
    } catch {
      // Best effort — the resume marker is a launcher nicety; a stale
      // marker must never block a clean exit.
    }
    try {
      instance?.unmount()
    } catch {
      // The terminal state may already be gone (broken pipe, alt session);
      // the exit path must never throw.
    }
    if (error !== undefined) {
      // Error-driven unmount (render crash): stay loud and exit non-zero.
      // A success code + resume hint here would tell wrappers/CI the
      // session ended cleanly while the TUI actually crashed.
      const message = error instanceof Error ? error.message : String(error)
      ctx.logger.error(`cc-tui: exit after error: ${message}`)
      if (process.stderr.isTTY) {
        process.stderr.write(`\ncc-tui crashed: ${message}\n`)
      }
      disposeRootAndExit(ctx, 1)
      return
    }
    if (process.stdout.isTTY) {
      process.stdout.write(`\nResume with -c (or command below):\ndsh-cc --resume ${channel.agentId}\n\n`)
    }
    disposeRootAndExit(ctx, 0)
  }

  const chat = React.createElement(Chat, {
    channel,
    questionStore,
    onExit: () => handleExit(),
  })
  // fullscreen: wrap the tree in <AlternateScreen> (DEC 1049 + SGR mouse
  // tracking), which turns on in-app text selection (copy-on-select via
  // useCopyOnSelect), wheel scroll, and click/hover hit-testing. Inline
  // mode leaves the mouse to the terminal emulator's native selection.
  const tree = React.createElement(
    ThemeProvider,
    null,
    config.fullscreen ? React.createElement(AlternateScreen, null, chat) : chat,
  )
  instance = await render(tree, { exitOnCtrlC: false })

  // If the surrounding tree goes down (reload, teardown), take the TUI with it.
  ctx.effect(() => () => {
    instance?.unmount()
  })

  // The TUI is the front door: when it unmounts (Ctrl+C), dispose the app
  // tree and exit the process. The rejection handler covers error-driven
  // unmounts — without it a rejected exitPromise became an unhandled
  // rejection instead of a clean exit.
  void instance.waitUntilExit().then(handleExit, handleExit)
}

/**
 * Attach to an existing agent, resume a persisted session (`dsh-cc --resume`
 * feeds the id through `config.sessionId`), or create a fresh one. Resume
 * goes through the DSH persistence seam (`ctx.agents.resume` reads the
 * session log written by dsh-session-persistence-jsonl); a missing artifact
 * or unmounted backend falls back to a fresh session, as does a plain boot
 * without a session id.
 *
 * Preset composition (issue #8): a create resolves the requested preset
 * (cordis.yml `preset` over the persisted `/preset` choice over the roster
 * default) and mounts it in the factory's setup hook; a resume re-mounts the
 * preset the session's own log records. Without the roster both paths behave
 * as before presets existed.
 *
 * Model route (issues #14/#30/#67): a create adopts the caller's atomically
 * resolved route (validated against the adapter catalog below); a resume
 * passes only a COMPLETE cordis.yml route through — a provider-only pin must
 * not half-override the route the target session's own records carry.
 */
async function resolveAgent(
  ctx: Context,
  requestedSessionId: string | undefined,
  configuredRoute: { provider?: string; model?: string },
  startupRoute: ModelRoute,
  meta: { cwd: string },
  configuredPreset?: string,
): Promise<{ agent: Agent; handle?: AgentHandle; agentPreset?: string; route?: ModelRoute }> {
  // Resume override (issue #67): cordis.yml overrides the target session's
  // recorded route only when it pins BOTH halves; undefined halves let the
  // session's own request/header records win (issue #30).
  const resumeRoute = explicitModelRoute(configuredRoute)
  const resumeOptions = { provider: resumeRoute?.provider, model: resumeRoute?.model }
  if (requestedSessionId !== undefined) {
    const resumeId = SessionId(requestedSessionId)
    const existing = ctx.agents.get(resumeId)
    if (existing !== undefined) {
      return { agent: existing, agentPreset: runningPresetOf(existing.session) }
    }
    try {
      // The resumed session keeps the preset its log records (last
      // `agent-preset/selected` wins over the creation header), never the
      // caller's current preference.
      const persisted = await resolvePersistedPreset(ctx, resumeId)
      const composed = await composePreset(ctx, persisted)
      const resumed = await ctx.agents.resume({
        resumeSessionId: resumeId,
        agentOptions: resumeOptions,
        ...(composed.setup === undefined ? {} : { setup: composed.setup }),
      })
      return { agent: resumed.agent, handle: resumed, agentPreset: composed.agentPreset }
    } catch (error) {
      // No artifact (first run / cleared storage) or persistence not
      // mounted: fall through to a fresh session, but stay loud in the log.
      ctx.logger.warn(
        `cc-tui: resume of "${requestedSessionId}" failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }
  const sessionId = SessionId(randomUUID())
  const composed = await composePreset(ctx, configuredPreset ?? readPresetPref())
  // Fresh-session route precedence (issues #14/#30/#67): resolved atomically
  // by the caller (complete cordis.yml route > the persisted `/model` choice
  // > the harness default), then validated against the adapter catalog — a
  // stale persisted choice falls back to the default route wholesale instead
  // of reaching the server as an unknown model name.
  const llm = ctx.get('llm') as
    | { listModels(provider: string): Promise<readonly { id: string }[]> }
    | undefined
  const { route, rejected } = await validateModelRoute(llm, startupRoute)
  if (rejected !== undefined) {
    ctx.logger.warn(
      `cc-tui: model route ${rejected.provider}/${rejected.model} is not advertised by provider "${rejected.provider}"; falling back to ${route.provider}/${route.model}`,
    )
  }
  const created = await ctx.agents.create({
    sessionId,
    meta: {
      ...meta,
      // Durable header value: a later resume re-mounts exactly this preset.
      ...(composed.agentPreset === undefined ? {} : { agentPreset: composed.agentPreset }),
    },
    agentOptions: route,
    ...(composed.setup === undefined ? {} : { setup: composed.setup }),
  }).catch((error: unknown) => {
    // Fail loud with the reason on stderr — a dead TUI with no message is
    // the worst outcome for a misconfigured leaf (unknown provider/model).
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `cc-tui: failed to create agent (provider=${route.provider}, model=${route.model}): ${message}`,
    )
  })
  return { agent: created.agent, handle: created, agentPreset: composed.agentPreset, route }
}

/**
 * Dispose the whole application before process exit, with a bounded fallback.
 * Mirrors the deleted dsh-tui front-door exit semantics.
 */
function disposeRootAndExit(ctx: Context, code: number): void {
  const timer = setTimeout(() => process.exit(code), 5000)
  timer.unref()
  void ctx.root.fiber.dispose().then(
    () => {
      clearTimeout(timer)
      process.exit(code)
    },
    () => {
      clearTimeout(timer)
      process.exit(code)
    },
  )
}
