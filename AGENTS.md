# dsh-TUI 项目指南（AGENTS.md）

> 本文件随仓库分发，面向本仓库的**所有**合作开发者与 AI agent。
> 本机工作区管理细节见本地 `.agent/WORKSPACE.md`（不入库）。

## 项目是什么

**dsh-cc-tui**：DeepSeek Harness 官方公众号收录的 Claude Code 风格全屏 TUI
（cordis 插件，npm 包名 `dsh-cc-tui`）。零核心改动、纯插件挂载，官方目前只有
Web UI，本插件补齐终端体验。

- **技术栈**：TypeScript + React 19 + 移植版 Ink core（`react-reconciler` 渲染，
  布局引擎为纯 JS 移植版 Yoga）+ cordis 插件体系。
- **运行要求**：node `^22.19 || >=24`、pnpm 11（CI 锁定）。本机 node v24 / pnpm 11.21。
- **语言**：项目以**中文为主**——README、commit、issue、PR 均用中文；
  英文 README（`README_EN.md`）须同步维护。
- **架构速览**：`src/` 源码 → `lib/types/` 构建产物（**入库**）；`scripts/` 下
  是 probe/verify/repro/smoke 脚本；`skills/` 是随 npm 分发的 7 个技能
  （audit / bug / pr-comments / practice / release-notes / review / vuln-check）。

## 工作区布局（合作者通用约定）

```text
<repo>/
├── (主工作区 = main，日常开发、合 PR、发版)
├── worktrees/            ← git worktree 区域，按前缀分类，不入库
│   ├── pr/<编号>-<slug>/   PR 审查
│   ├── dev/<feature>/      功能开发
│   ├── exp/<name>/         实验（永不合并，除非转正）
│   ├── fix/<issue>/        修复
│   └── release/v<版本>/    发布预演
└── scratch/              临时草稿/复现现场，用完即删，不入库
```

- 任何本地分支一律在 `worktrees/` 的独立工作区操作，**主工作区保持干净**；
- 新建/清理 worktree：`powershell -File .agent/wt.ps1 new|list|rm`（详见
  `.agent/WORKSPACE.md`）；
- 每棵 worktree 独立 `node_modules`（走 pnpm 全局 store 硬链接，安装很快）。

## 分支与协作规范

- **分支命名**：`feat/<特性>`、`fix/<issue号或描述>`、`chore/<杂务>`、
  `docs/<主题>`、`test/<主题>`、`exp/<实验>`、`release/v<版本>`、`ci/<主题>`。
  已有远端分支遵循 `fix/*`、`chore/*` 风格。
- **main 保护**：main 只接受经过 review 的合并；本地主干改动先 `git pull --rebase`
  再 push，避免历史分叉。
- **PR 规范**：标题用中文（或中英对照），描述写清动机、改动点、验证方式；
  引用相关 issue（`#N`）。
- **合入纪律**：合 PR 前必须 CI 全绿 + 本地回归通过（见下节）。

## 构建与验证（PR 必过项）

CI（`.github/workflows/ci.yml`）在 push main 与所有 PR 上运行，包含**五件套**，
本地必须能复现：

```bash
pnpm install --frozen-lockfile     # 锁文件权威；rc 依赖白名单在 pnpm-workspace.yaml
pnpm build                          # tsc → lib/types（产物入库，改 src 后必须同步提交）
node --import tsx/esm scripts/repro-askpanel.tsx        # 提问面板内联输入 + 工具卡排版断言
node --import tsx/esm scripts/verify-askpanel-layout.tsx # 提问面板全应用布局回归
node --import tsx/esm scripts/repro-toolcards.tsx        # 工具卡结构化排版回归
```

`scripts/` 其它脚本按用途：`verify-*.tsx|mjs` = 回归断言；`repro-*.tsx` = 问题
复现；`probe|perf|leak` 系列 = 渲染/性能/内存调查；`smoke.tsx` = headless 冒烟
（`pnpm smoke`）。新增功能尽量附一个 verify/repro 脚本，并挂进 CI。

## 提交规范

参考现有历史（`git log`），格式为**中文 conventional commits**：

```
type(scope): 中文描述（版本号，issue #N）(#PR)
```

示例：`feat(i18n): en/zh UI language switch with /lang command (#22)`
`fix: /resume 与 dsh web 共用 JSONL 会话库（#24） (#37)`

- type：`feat` / `fix` / `docs` / `chore` / `test` / `ci` / `refactor` / `perf`；
- scope：可选（模块名如 i18n、model、resume）；
- 正文可补充背景；一次提交只做一件事。

## 审查 PR checklist

1. `gh pr view <n>` 看意图；大 PR 先派 subagent 并行审查（见全局规范）；
2. 建独立 worktree（`wt.ps1 new pr <n>`）跑本地五件套；
3. 按 `skills/review` 技能的四透镜审查：设计 / 正确性 / 可维护性 / 测试；
4. 本项目重点：**渲染回归**（面板布局、工具卡、思考流式、滚动、resize）、
   **事件流消费**（session/event → 差分渲染）、**会话持久化**（JSONL/SQLite、
   resume/fork/rewind 语义）、**i18n 双语同步**、**性能红线**（布局级虚拟化：
   帧成本须 O(可视窗口)，禁止把长会话重建成 O(全会话)）；
5. 评论区分 must-fix / consider，先阻塞后 nit，结尾给出肯定。

## 发布流程（npm）

由 tag 触发（`.github/workflows/publish.yml`），入口：

```bash
git tag vX.Y.Z && git push origin vX.Y.Z
```

- **标签版本必须与 package.json 的 version 完全一致**，否则 CI 直接失败；
- 发布前 CI 会跑 build + repro-askpanel + repro-toolcards；
- 发版步骤：改 `package.json` version → 更新双 README（如有）→ 提交 →
  build 确认 lib 同步 → 打 tag push。

## 红线（绝对不要碰）

- `.github/workflows/` 是**项目自己的 CI 与发布**，永远不禁用、不删除、不绕行
  （全局规范中"禁用 Actions"仅适用于新建的备份仓库，不适用于本仓库）；
- `pnpm-lock.yaml` / `pnpm-workspace.yaml`：加依赖用 `pnpm add` 生成，不要手改
  白名单结构；`pnpm install` 一律 `--frozen-lockfile`；
- `lib/` 已入库：只改 src 不提交 lib 会被 CI/用户安装双重打脸；
- README 中英双份必须同步，缺一不可；
- 不向 `main` 直接推送未经 review 的大改动；不重写已推送历史（force push 仅限
  自己的未合并 PR 分支）；
- 本仓库是上游热门仓库：**不要**为它创建 backup 镜像仓库推来推去，一切变更
  走 PR / 直接 push 到自己的分支。

## 环境与通用规则（继承全局）

- 称呼用户：**风雪**；
- 网络：npm / pnpm / git / gh 一律走本机 Clash 代理 `127.0.0.1:7897`（已全局配置）；
- 大搜索/阅读任务派 subagent 执行，减少主上下文污染；
- DeepSeek 系模型无视觉，gpt 系有视觉——截图类任务选有视觉的模型。
