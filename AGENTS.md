# AGENTS.md

给在此仓库工作的 AI 编码助手的说明。

## 这是什么

DeepSeek Harness（DSH）的一个客户端插件：把一份 Agent 预设画成节点图，并实时高亮当前执行到的节点。没有构建步骤，没有依赖，没有测试框架。

## 文件

| 文件 | 作用 |
|---|---|
| `client.js` | 全部实现（约 2500 行）。图构建、布局、实时状态、React 渲染、PNG 导出 |
| `index.js` | Host 半边。只有 `export function apply() {}`，存在的意义是给 bundle 一个 Loader 行 |
| `cordis.patch.yml` | 把 bundle 挂进 Loader |
| `package.json` | bundle 清单 + `dsh.client` 声明 |
| `docs/` | README 用的截图 |

## 硬性约束

1. **不要 import 任何 Harness 客户端包。** 这个插件以纯 JS 动态模块加载（`window.__ModuleLoader__.load`），只能 `require('react')`。Harness 的客户端包会随版本变化，且抛错会导致整个 slot 条目崩溃（控制台显示 `slot entry crashed in '<slot>'`）。
2. **只用 `--dsw-alias-*` 主题 token。** 不要硬编码颜色。需要非文字色（如节点强调色）时用 token，导出 PNG 时有专门逻辑把它们解析成实际色值。
3. **所有面向用户的文案走 `ctx.locale`**，同时在 `ZH` / `EN` 字典里保留一份兜底（locale 服务不可用时使用）。
4. **改动后跑 `node --check client.js`。** 这是唯一的自动化检查。

## 关键内部结构

- `ensureShared()` —— 状态放在 `globalThis`（`SHARED_KEY`）而不是模块作用域，这样插件热重载不会丢面板状态、也不会出现两份互相矛盾的 store。里面挂着预设清单、实时状态、折叠集合。
- `buildGraph(preset, options)` —— 纯函数，输入一份预设，输出 `{ nodes, blocks, edges, stats }` 和画布尺寸。布局规则全在这里（左右为入口/预设/当前调用/Agent，中间是按类别堆叠的块）。
- `liveFrom(entries, running)` —— 把会话事件窗口折叠成"此刻在做什么"：当前工具、开始时间、轮次、本轮调用过的工具、以及每个工具的调用次数与耗时。
- `resolveToolEntry(toolName, layout)` —— 工具名到节点条目 id 的两级映射（内置表 + 模糊匹配）。
- `GraphView` —— 画布组件，被两个表面共用（对话页标签、设置页）。
- `downloadGraphPng` / `buildGraphSvg` —— 导出链路，不依赖外部库。

## 踩过的坑

- **同一个 state 不要承担两种语义。** 曾经把"手选的预设"和"选中的节点"共用一个 `selectedId`，结果点一下节点就会把预设切回默认值、整图重绘。现在拆成 `presetChoice` 和 `selectedId`。
- **折叠不要触发重新适配。** 适配（`fit`）只在预设身份变化时执行，否则折叠一个类别会把镜头甩回左上角。
- **自动跟随不要依赖整个 layout。** 依赖运行节点的 id 即可，否则任何布局变化（折叠、数据刷新）都会把用户视线拽走。
- **`tool/result` 事件经常不带 `callId`。** 配对耗时必须回退到"最早一个未完成的调用"，否则所有调用都会被算成"进行中"。
- **`conversation.view` 的注册项本身就是标签**：`id` + `label`，`order` 决定它排在「对话」「轨迹」之后的位置。

## 发布

`package.json` 里的 `repository.url` 目前是 `OWNER` 占位，发布前替换成真实仓库地址。`private: true` 保留即可（不发布到 npm）。
