# agent-preset-graph-xww

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![DSH](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4c8dff.svg)](https://github.com/deepseek-ai)

把 **Agent 预设**画成一张 ComfyUI 风格的节点图，并实时高亮这个 Agent 此刻跑在哪一个节点上。

DeepSeek Harness 的「预设」本质上是一份插件清单 —— 它决定了这个 Agent 有哪些工具、装了什么技能、能不能派子 Agent。这份清单平时只能对着 YAML 看。这个插件把它画成图：左边是任务入口，中间是这份预设声明的每一类能力，右边是它们共同构成的 Agent 执行循环。

![总览](docs/overview.png)

---

## 它长什么样

打开任意一个会话，对话页标签栏会多出第三个标签：`对话 | 轨迹 | 节点图`。

图从左到右是一条流水线：

```
任务/会话 → 预设 → [各类能力块] → 当前调用 → Agent 执行循环
```

- **能力块**：预设声明的插件按包名归类（提示词与身份、技能、命令、上下文管理、子 Agent 委派、工具、运行时控制、其它插件），每个插件是一张节点卡，卡上是它的短名、条目 id、完整模块名和启用状态
- **部署级插件**：单独一块，装的是这个部署额外装载、但**不属于这份预设**的插件（见下文）。它用虚线弱连接，表示"能被执行，但不是这份预设给的"
- **当前调用**：Agent 的工作台面。正在跑的工具会在这里显示名字和实时计时
- **连线**表示「组合」关系；虚线表示「部署级，非预设声明」

## 实时高亮

顶部实时条给出四件事：**正在执行什么 · 跑了多久 · 第几轮 · 当前会话用的是哪份预设**。

![实时高亮](docs/live.png)

图上同时有三层信息：

| 层 | 含义 |
|---|---|
| **强高亮 + 呼吸光晕 + 「运行中」徽章** | 此刻正在执行的节点 |
| **流动虚线** | 工作流经的路径（预设 → 所在能力块 → 当前调用 → Agent 循环） |
| **绿色淡高亮** | 本轮已经走过的节点，一条长回合读起来是一条路径 |

工具到节点的对应关系有两级：内置工具走内置映射表（`pwsh → tool-pwsh`、`edit/read → tool-fs`…），表外的第三方工具用工具名做模糊匹配（`tabbit_browser → dsh-tabbit-xww`）。都匹配不上时，高亮落到「当前调用」节点上，实时条照实写工具名 —— 任何工具跑起来，图上一定有东西在亮。

## 点开看详情

点任意节点，下方展开它的完整信息；点画布空白处收起，把空间还给画布。

![节点详情](docs/detail.png)

详情里除了条目 id、模块、类别、启用条件、运行状态，还会给一行**本轮统计**：这个节点被调用了几次、累计耗时多少、还有几次在飞行中。

## 折叠成大纲

类别标题可以单独折叠，也可以在工具栏一键**全部折叠** —— 45 个节点的图收成一张主干大纲：

![折叠大纲](docs/folded.png)

工具栏：`预设 · − · + · 适配 · 定位 · 全部折叠/展开 · 导出 · ☑自动 · 搜索 · 统计`

- **定位**：手动拖走后一键回到当前执行的节点（自动跟随不会跟你抢镜头，只在你切换到另一个运行节点时才移动）
- **自动**（默认开）：跟随运行节点，放大到 1:1 并居中
- **搜索**：按名称、模块或条目 id 过滤，命中项标黄、其余淡出
- **导出**：把当前图导出成 2 倍分辨率的 PNG，方便贴给别人

## 设置里的浏览面

设置 →「预设节点图」是同一个图的静态浏览器，可以逐份查看每个预设的组成，带折叠、搜索和导出。深色浅色都跟随主题。

![设置页](docs/settings.png)

---

## 安装

插件装在 DSH 的 **profile** 里。编辑你的 profile 目录（`$DSH_HOME/profiles/<name>/`）下的 `package.json`：

```json
{
  "dependencies": {
    "agent-preset-graph-xww": "github:OWNER/agent-preset-graph-xww"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "agent-preset-graph-xww"
      ]
    }
  }
}
```

然后在 profile 目录执行 `pnpm install`，重启 DSH。

本地开发可以直接指向工作副本：

```json
"agent-preset-graph-xww": "link:D:/path/to/agent-preset-graph-xww"
```

### 卸载

从 `dependencies` 和 `dsh.profile.bundles` 里删掉这一项，再 `pnpm install` 即可。

---

## 它是怎么做到的

插件是纯客户端（browser half）的，**不依赖任何构建步骤**，也不 import 任何 Harness 客户端包。所有数据都来自 DSH 已经暴露的服务：

| 数据 | 来源 |
|---|---|
| 每份预设的插件清单 | `ctx.remote.pluginInventory.list()` → `agentPresets[].rows[]` |
| 部署里装载的全部插件 | 同一个调用的 `entries[]`（用来算出「部署级插件」） |
| 当前会话用的是哪份预设 | `ctx.sessions.list` 快照里的 `projectionValues.agentPreset` |
| 正在执行什么工具 | `ctx.sessions.retain()` 拿到的事件窗口（`tool/call` / `tool/result`） |
| 文案与预设名 | `ctx.locale` |

几个实现上的取舍：

- **「部署级插件」的判定**：模块名不在 `@deepseek-ai/` 命名空间下、已启用、且不在当前预设的清单里。DSH 自带的一百多个 entry 因此被排除在外。
- **能力分类是按包名前缀推断的**，不是 DSH 的官方分类 —— 界面上的说明也这么写。
- **导出 PNG 没有引入依赖**：把同一份布局数据重绘成独立 SVG，再用 canvas 光栅化。主题色是通过一个隐藏探针元素把 CSS 变量解析成实际色值写进 SVG 的，所以深色浅色都能正确导出。
- **样式只用 `--dsw-alias-*` 主题 token**，没有硬编码颜色，因此跟随宿主主题与语言。

## 已知限制

- 工具到节点的映射表覆盖 DSH 内置工具；第三方工具靠名字模糊匹配，名字与包名完全无关时只能高亮「当前调用」节点。
- 预设组成来自 Plugin Inventory 的**扁平化**结果，Loader 的 group 层级不会体现在图上。
- 高亮统计按**当前轮次**计算；超出事件窗口的老调用不会计入。

## 开发

没有构建步骤，改完 `client.js` 刷新页面即可（profile 用 `link:` 安装时）。

```bash
node --check client.js     # 唯一的检查
```

- `client.js` —— 全部实现：图构建、布局、实时状态、渲染、导出
- `index.js` —— Host 半边，只提供一个 Loader 行，无行为
- `cordis.patch.yml` —— 把这个 bundle 挂进 Loader

## 许可

[MIT](./LICENSE)
