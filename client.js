/**
 * Agent preset node graph — browser half.
 *
 * Three surfaces over one model of "what an Agent preset is made of":
 *
 *   1. `sidebar.footer.action` — the entry directly above Settings, with a
 *      badge while any Agent runs.
 *   2. `shell.overlay` — the live panel: the current Session's preset drawn as
 *      a ComfyUI-style node canvas, with the node the Agent is working through
 *      right now highlighted.
 *   3. `settings.section` — the same canvas as a static browser over every
 *      declared preset.
 *
 * Everything is derived from Client-side state that already exists:
 *
 *   - `ctx.remote.pluginInventory.list()` → `agentPresets[].rows[]`: each
 *     preset's flattened composition (entry id, module, enablement, condition,
 *     fiber phase). These rows become the nodes.
 *   - `ctx.sessions.list` → which Sessions exist, whether their Agent runs, and
 *     `projectionValues.agentPreset`, the preset that Session composed.
 *   - `ctx.sessions.retain()` → a live event window whose `tool/call` /
 *     `tool/result` records say which tool is executing right now.
 *
 * No Harness Client package is imported; styles ship as an element inside each
 * surface, so unmounting removes them.
 */

window.__ModuleLoader__.load({
  id: 'agent-preset-graph-xww',

  factory(require) {
    const React = require('react');
    const useCallback = React.useCallback;
    const useEffect = React.useEffect;
    const useLayoutEffect = React.useLayoutEffect;
    const useMemo = React.useMemo;
    const useRef = React.useRef;
    const useState = React.useState;
    const useSyncExternalStore = React.useSyncExternalStore;
    const h = React.createElement;

    /* ------------------------------------------------------------------ *
     * Identity
     * ------------------------------------------------------------------ */

    const NS = 'dsh.agentPresetGraphXww';
    const SURFACE_ID = 'agent-preset-graph-xww';
    const SOURCE = 'agent-preset-graph-xww';
    const SHARED_KEY = '__DSH_AGENT_PRESET_GRAPH_XWW__';
    const OPEN_STORAGE_KEY = 'dsh.agent-preset-graph-xww.open';
    const GEOMETRY_KEY = 'dsh.agent-preset-graph-xww.geometry';
    const PUBLISH_DELAY = 140;
    const MAX_ENTRIES = 800;

    /* ------------------------------------------------------------------ *
     * Copy (also the fallback when the locale service has no dictionary)
     * ------------------------------------------------------------------ */

    const ZH = {
      nav: '预设节点图',
      viewTab: '节点图',
      exportPng: '导出',
      exportTitle: '把当前节点图导出为 PNG',
      exportFailed: '导出失败：{reason}',
      exportDone: '已导出 PNG',
      collapseHint: '点击节点查看详情，点击类别标题折叠或展开它',
      collapseAll: '全部折叠',
      expandAll: '全部展开',
      statCalls: '本轮调用 {n} 次',
      statTime: '累计 {t}',
      statRunning: '{n} 次进行中',
      statNone: '本轮还没调用过',
      trigger: '预设节点图',
      triggerBadge: '{n} 个 agent 运行中',
      panelTitle: 'Agent 预设节点图',
      title: '预设节点图',
      intro: '把选中的 Agent 预设画成节点图：左边是任务入口，中间是这份预设声明的每一类能力，右边是它们共同构成的 Agent 执行循环。连线表示「组合」关系。',
      panelIntro: '当前会话所用预设的节点图，执行中的节点会实时高亮。',
      presetSelect: '预设',
      sessionSelect: '会话',
      noSession: '没有可显示的会话',
      nodeCount: '{n} 个节点',
      onCount: '启用 {n}',
      offCount: '停用 {n}',
      condCount: '条件 {n}',
      fit: '适配',
      autoFollow: '自动',
      autoFollowTitle: '自动跟随正在执行的节点',
      locate: '定位',
      locateTitle: '回到当前执行的节点',
      searchPlaceholder: '搜索节点',
      searchTitle: '按名称、模块或条目 id 过滤节点',
      zoomIn: '放大',
      zoomOut: '缩小',
      refresh: '刷新',
      close: '关闭',
      loading: '正在读取预设组成…',
      empty: '这个部署没有声明任何 Agent 预设。',
      failed: '读取预设组成失败：{reason}',
      brokenPreset: '该预设的组成无法读取：{reason}',
      entryTitle: '任务 / 会话',
      entrySub: '开始时选定一个 Agent 预设',
      presetSub: '{n} 个插件行',
      presetDefault: '新任务默认',
      agentTitle: 'Agent 执行循环',
      agentSub: '模型调用 ⇄ 工具执行',
      callTitle: '当前调用',
      callIdle: '空闲',
      callModel: '模型调用中',
      callRunning: '执行中',
      categoryFallback: '能力',
      detail: '节点详情',
      detailHint: '点击画布上的任意节点，这里显示它的完整信息。',
      legend: '分类按插件包名前缀判定，只用于说明这份预设挂载了哪些能力。',
      liveIdle: '空闲',
      liveModel: '模型调用中',
      liveTool: '正在执行 {name}',
      liveWaiting: '等待你的回答：{name}',
      liveRecent: '最近执行：{name}',
      liveTurn: '第 {n} 轮',
      liveBadge: '运行中',
      liveSession: '{title}',
      livePreset: '预设：{name}',
      liveNoPreset: '该会话未记录预设',
      fEntryId: '条目 id',
      fModule: '模块',
      fStatus: '状态',
      fCondition: '启用条件',
      fCategory: '能力类别',
      fDescription: '说明',
      fFiber: '运行状态',
      statusOn: '已启用',
      statusOff: '已停用',
      statusConditional: '条件启用',
      statusFailed: '启动失败',
      statusPending: '启动中',
      catPrompt: '提示词与身份',
      catSkills: '技能',
      catCommands: '命令',
      catContext: '上下文管理',
      catDelegation: '子 Agent 委派',
      catTools: '工具',
      catControl: '运行时控制',
      catOther: '其它插件',
      catDeploy: '部署级插件',
      deployCount: '+{n} 部署级',
    };

    const EN = {
      nav: 'Preset graph',
      viewTab: 'Graph',
      exportPng: 'Export',
      exportTitle: 'Export the current node graph as a PNG',
      exportFailed: 'Export failed: {reason}',
      exportDone: 'PNG exported',
      collapseHint: 'Click a node for its detail, or a category title to fold it',
      collapseAll: 'Fold all',
      expandAll: 'Expand all',
      statCalls: '{n} calls this turn',
      statTime: '{t} total',
      statRunning: '{n} in flight',
      statNone: 'Not called this turn',
      trigger: 'Preset graph',
      triggerBadge: '{n} agents running',
      panelTitle: 'Agent preset graph',
      title: 'Preset graph',
      intro: 'The selected Agent preset drawn as a node graph: the task entry on the left, every capability category the preset declares in the middle, and the Agent loop they compose on the right. Edges mean "composes".',
      panelIntro: 'The node graph of the preset this Session runs; the node being worked through is highlighted live.',
      presetSelect: 'Preset',
      sessionSelect: 'Session',
      noSession: 'No Session to show',
      nodeCount: '{n} nodes',
      onCount: '{n} on',
      offCount: '{n} off',
      condCount: '{n} conditional',
      fit: 'Fit',
      autoFollow: 'Auto',
      autoFollowTitle: 'Follow the node being executed',
      locate: 'Locate',
      locateTitle: 'Jump back to the node being executed',
      searchPlaceholder: 'Find node',
      searchTitle: 'Filter nodes by title, module or entry id',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      refresh: 'Refresh',
      close: 'Close',
      loading: 'Reading the preset composition…',
      empty: 'This deployment declares no Agent preset.',
      failed: 'Could not read the preset composition: {reason}',
      brokenPreset: 'This preset cannot be read: {reason}',
      entryTitle: 'Task / Session',
      entrySub: 'Picks an Agent preset when the task starts',
      presetSub: '{n} plugin rows',
      presetDefault: 'New task default',
      agentTitle: 'Agent loop',
      agentSub: 'Model call ⇄ tool execution',
      callTitle: 'Current call',
      callIdle: 'Idle',
      callModel: 'Model call',
      callRunning: 'Running',
      categoryFallback: 'Capability',
      detail: 'Node detail',
      detailHint: 'Click any node on the canvas to read its full detail here.',
      legend: 'Categories follow the plugin package prefix; they only describe which capabilities this preset mounts.',
      liveIdle: 'Idle',
      liveModel: 'Model call in progress',
      liveTool: 'Running {name}',
      liveWaiting: 'Waiting for you: {name}',
      liveRecent: 'Last run: {name}',
      liveTurn: 'Turn {n}',
      liveBadge: 'Running',
      liveSession: '{title}',
      livePreset: 'Preset: {name}',
      liveNoPreset: 'This Session records no preset',
      fEntryId: 'Entry id',
      fModule: 'Module',
      fStatus: 'Status',
      fCondition: 'Condition',
      fCategory: 'Category',
      fDescription: 'Description',
      fFiber: 'Runtime',
      statusOn: 'Enabled',
      statusOff: 'Disabled',
      statusConditional: 'Conditional',
      statusFailed: 'Failed',
      statusPending: 'Starting',
      catPrompt: 'Prompt & identity',
      catSkills: 'Skills',
      catCommands: 'Commands',
      catContext: 'Context management',
      catDelegation: 'Sub-agent delegation',
      catTools: 'Tools',
      catControl: 'Runtime control',
      catOther: 'Other plugins',
      catDeploy: 'Deployment plugins',
      deployCount: '+{n} deployment',
    };

    /* ------------------------------------------------------------------ *
     * Canvas geometry
     * ------------------------------------------------------------------ */

    const NODE_W = 190;
    const NODE_H = 62;
    const NODE_GAP_X = 12;
    const NODE_GAP_Y = 10;
    const BLOCK_COLS = 3;
    const BLOCK_PAD = 12;
    const BLOCK_HEAD = 28;
    const BLOCK_GAP = 16;
    const SIDE_W = 152;
    /* The call node spells out a tool name, so it needs more room than the
       fixed-width entry and preset cards. */
    const CALL_W = 188;
    const COL_GAP = 58;
    const PAD = 24;
    const MIN_SCALE = 0.2;
    const MAX_SCALE = 2.4;
    /* A whole-preset fit lands far below this inside a Settings-width pane,
       where node titles stop being readable. The default view clamps here and
       starts at the flow's top-left; Fit still shows the whole composition. */
    const READABLE_FIT = 0.62;

    const CATEGORY_ORDER = ['prompt', 'skills', 'commands', 'context', 'delegation', 'tools', 'control', 'other', 'deploy'];

    const CATEGORY_LABEL_KEY = {
      prompt: 'catPrompt',
      skills: 'catSkills',
      commands: 'catCommands',
      context: 'catContext',
      delegation: 'catDelegation',
      tools: 'catTools',
      control: 'catControl',
      other: 'catOther',
      deploy: 'catDeploy',
    };

    const CATEGORY_ACCENT = {
      prompt: 'var(--dsw-alias-brand-primary)',
      skills: 'var(--dsw-alias-state-success-primary)',
      commands: 'var(--dsw-alias-state-warn-primary)',
      context: 'var(--dsw-alias-label-secondary)',
      delegation: 'var(--dsw-alias-brand-primary)',
      tools: 'var(--dsw-alias-state-success-primary)',
      control: 'var(--dsw-alias-state-warn-primary)',
      other: 'var(--dsw-alias-state-idle-primary)',
      deploy: 'var(--dsw-alias-label-secondary)',
    };

    const STATUS_ACCENT = {
      on: 'var(--dsw-alias-state-success-primary)',
      off: 'var(--dsw-alias-state-idle-primary)',
      conditional: 'var(--dsw-alias-state-warn-primary)',
      failed: 'var(--dsw-alias-state-error-primary)',
      pending: 'var(--dsw-alias-brand-primary)',
    };

    /** Shipped preset ids whose copy lives in the agent-preset dictionaries. */
    const BUILT_IN_PRESET_KEYS = {
      standard: { name: 'presetStandardName', description: 'presetStandardDescription' },
      ptc: { name: 'presetPtcName', description: 'presetPtcDescription' },
      minimal: { name: 'presetMinimalName', description: 'presetMinimalDescription' },
      cordis: { name: 'presetCordisName', description: 'presetCordisDescription' },
    };

    /**
     * Model-facing tool name → the composition row that provides it. A preset
     * declares plugins, not tools, so this is the one hand-written table in the
     * bundle; an unmapped tool still shows in the live bar, it just has no node
     * to point at.
     */
    const TOOL_ENTRY = {
      read: 'tool-fs',
      write: 'tool-fs',
      edit: 'tool-fs',
      read_image: 'tool-fs',
      glob: 'tool-fs-search',
      grep: 'tool-fs-search',
      pwsh: 'tool-pwsh',
      bash: 'tool-bash',
      web_search: 'tool-web',
      web_fetch: 'tool-web',
      skill: 'tool-skill',
      create_goal: 'tool-goal',
      get_goal: 'tool-goal',
      update_goal: 'tool-goal',
      todo_write: 'tool-todo',
      present: 'present',
      ask_user_question: 'tool-ask-user',
      subagent: 'tool-subagent',
      subagent_fork: 'tool-subagent-fork',
      subagent_codex: 'tool-subagent-codex',
      subagent_claude_code: 'tool-subagent-claude-code',
      list_agents: 'tool-subagent-list-agents',
      workflow: 'tool-workflow',
      ralph: 'tool-ralph',
      exit_plan_mode: 'plan-mode',
      job_list: 'tool-jobs',
      job_output: 'tool-jobs',
      job_kill: 'tool-jobs',
      run_in_background: 'tool-jobs',
    };

    /** Tools that block on the human, so the live bar can say "waiting". */
    const WAITING_TOOLS = { ask_user_question: true };

    /* ------------------------------------------------------------------ *
     * Stylesheet (rendered as an element inside each surface)
     * ------------------------------------------------------------------ */

    const CSS = `
.dspg-trigger{position:relative;display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;border:0;border-radius:10px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer;text-align:left}
.dspg-trigger:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dspg-trigger[aria-pressed='true']{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.dspg-trigger--rail{justify-content:center;padding:7px 0}
.dspg-trigger__icon{flex:none;width:18px;height:18px}
.dspg-trigger__label{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.dspg-trigger__badge{margin-left:auto;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base);font-size:11px;line-height:18px;text-align:center}
.dspg-trigger--rail .dspg-trigger__badge{position:absolute;top:0;right:8px;margin:0}

.dspg-view{display:flex;flex-direction:column;gap:10px;height:100%;min-height:0;padding:12px 14px;box-sizing:border-box;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.4}
.dspg-view .dspg-graph{flex:1}
.dspg-view__head{display:flex;align-items:center;gap:8px;flex:none}
.dspg-view .dspg-toolbar{padding-bottom:2px}
.dspg-block__head{cursor:pointer}
.dspg-block__head:hover .dspg-block__label{color:var(--dsw-alias-label-primary)}
.dspg-block__fold{flex:none;width:12px;font-size:10px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.dspg-block.is-folded{border-style:dotted;background:transparent}
.dspg-stat{margin-top:6px;display:flex;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.dspg-stat__hit{color:var(--dsw-alias-state-success-primary);font-weight:600}
.dspg-note{font-size:12px;color:var(--dsw-alias-state-success-primary);white-space:nowrap}
.dspg-panel{position:fixed;right:28px;bottom:96px;z-index:80;display:flex;flex-direction:column;overflow:hidden;background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.28);font-size:13px;line-height:1.4}
.dspg-panel__head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);cursor:grab;user-select:none}
.dspg-panel__head:active{cursor:grabbing}
.dspg-panel__title{font-weight:600}
.dspg-panel__meta{color:var(--dsw-alias-label-secondary);font-size:12px}
.dspg-panel__spacer{flex:1}
.dspg-panel__body{display:flex;flex-direction:column;flex:1;min-height:0;padding:10px 12px 12px;gap:8px;overflow:hidden}

.dspg-live{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:none;padding:7px 10px;border-radius:10px;border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);font-size:12px}
.dspg-live__dot{flex:none;width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-idle-primary)}
.dspg-live--model .dspg-live__dot,.dspg-live--tool .dspg-live__dot{background:var(--dsw-alias-brand-primary);animation:dspg-pulse 1.1s ease-in-out infinite}
.dspg-live--waiting .dspg-live__dot{background:var(--dsw-alias-state-warn-primary);animation:dspg-pulse 1.1s ease-in-out infinite}
.dspg-live--error .dspg-live__dot{background:var(--dsw-alias-state-error-primary)}
.dspg-live__text{font-weight:600;color:var(--dsw-alias-label-primary)}
.dspg-live__meta{color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.dspg-live__sep{flex:1}

.dspg-section{display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary);min-width:0}
.dspg-head{display:flex;flex-direction:column;gap:4px}
.dspg-title{margin:0;font-size:18px;font-weight:600}
.dspg-intro{margin:0;font-size:13px;line-height:1.55;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.dspg-graph{display:flex;flex-direction:column;gap:8px;min-height:0}
.dspg-graph--fill{flex:1}
.dspg-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:none}
.dspg-field{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.dspg-check{display:inline-flex;align-items:center;gap:5px;font-size:13px;color:var(--dsw-alias-label-primary);cursor:pointer;user-select:none;-webkit-user-select:none;white-space:nowrap}
.dspg-check input{margin:0;cursor:pointer;accent-color:var(--dsw-alias-brand-primary)}
.dspg-select{height:28px;max-width:280px;padding:0 8px;font-size:13px;font-family:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));border:.5px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:8px;outline:none}
.dspg-select:focus-visible{border-color:var(--dsw-alias-brand-primary)}
.dspg-button{height:28px;min-width:28px;padding:0 9px;font-size:13px;font-family:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));border:.5px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:8px;cursor:pointer}
.dspg-button:hover{background:var(--dsw-alias-bg-layer-1)}
.dspg-button:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dspg-button:disabled{opacity:.4;cursor:default}
.dspg-search{height:28px;width:136px;padding:0 8px;font-size:13px;font-family:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));border:.5px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:8px;outline:none}
.dspg-search:focus-visible{border-color:var(--dsw-alias-brand-primary)}
.dspg-stats{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:12px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));white-space:nowrap}
.dspg-canvas{position:relative;height:420px;border:.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;user-select:none;-webkit-user-select:none}
.dspg-canvas--tall{height:min(62vh,600px);min-height:320px}
.dspg-graph--fill .dspg-canvas{height:auto;flex:1;min-height:180px}
.dspg-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(var(--dsw-alias-border-l1) 1px,transparent 1px),linear-gradient(90deg,var(--dsw-alias-border-l1) 1px,transparent 1px);background-size:26px 26px;opacity:.5}
.dspg-viewport{position:absolute;inset:0;cursor:grab;touch-action:none;overflow:hidden;user-select:none;-webkit-user-select:none}
.dspg-viewport.is-panning{cursor:grabbing}
.dspg-world{position:absolute;top:0;left:0;transform-origin:0 0}
.dspg-edges{position:absolute;top:0;left:0;overflow:visible;pointer-events:none}
.dspg-edges path{fill:none;stroke:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));stroke-width:1.4}
.dspg-edges path.is-strong{stroke:var(--dsw-alias-brand-primary);stroke-width:1.8}
.dspg-edges path.is-aux{stroke-dasharray:4 5;opacity:.7}
.dspg-edges path.is-live{stroke:var(--dsw-alias-brand-primary);stroke-width:2.6;stroke-linecap:round;stroke-dasharray:9 7;animation:dspg-flow .75s linear infinite}
.dspg-edges circle{fill:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));stroke:none}
.dspg-edges circle.is-strong{fill:var(--dsw-alias-brand-primary)}
.dspg-edges circle.is-live{fill:var(--dsw-alias-brand-primary);r:3.4}
.dspg-block{position:absolute;box-sizing:border-box;border:1px dashed var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1))}
.dspg-block__head{display:flex;align-items:center;gap:7px;height:28px;padding:0 11px}
.dspg-block__dot{width:7px;height:7px;border-radius:50%;flex:none}
.dspg-block__label{font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dspg-block__count{font-size:11px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));opacity:.8}
.dspg-block.is-live{border-color:var(--dsw-alias-brand-primary);border-style:solid;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 10%,var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1)));box-shadow:0 0 0 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 45%,transparent)}
.dspg-block.is-live .dspg-block__label{color:var(--dsw-alias-brand-primary)}
.dspg-node{position:absolute;box-sizing:border-box;display:flex;flex-direction:column;border:.5px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:10px;background:var(--dsw-alias-bg-layer-1);overflow:hidden;cursor:pointer;transition:border-color .14s,box-shadow .14s}
.dspg-node:hover{border-color:var(--dsw-alias-brand-primary)}
.dspg-node:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.dspg-node.is-selected{border-color:var(--dsw-alias-brand-primary);box-shadow:0 0 0 1px var(--dsw-alias-brand-primary)}
.dspg-node.is-trail{border-color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 12%,var(--dsw-alias-bg-layer-1))}
.dspg-node.is-dim{opacity:.25}
.dspg-node.is-hit{border-color:var(--dsw-alias-state-warn-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-warn-primary)}
.dspg-node.is-live{border:2px solid var(--dsw-alias-brand-primary);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 22%,var(--dsw-alias-bg-layer-1));animation:dspg-live-pulse 1.15s ease-in-out infinite;z-index:2}
.dspg-node.is-live .dspg-node__title{font-size:12.5px;font-weight:700}
.dspg-node.is-live .dspg-node__bar{height:4px}
.dspg-node__bar{height:3px;flex:none}
.dspg-node__body{display:flex;flex-direction:column;gap:3px;padding:7px 9px 8px;min-width:0}
.dspg-node__top{display:flex;align-items:center;gap:6px;min-width:0}
.dspg-node__title{flex:1 1 auto;min-width:0;font-size:12px;font-weight:600;line-height:1.3;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dspg-node__sub{font-size:10.5px;line-height:1.3;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dspg-node__module{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:9.5px;line-height:1.3;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));opacity:.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dspg-node--wide .dspg-node__title{white-space:normal}
.dspg-badge{flex:none;padding:0 6px;height:16px;display:inline-flex;align-items:center;border-radius:999px;font-size:10px;font-weight:500;line-height:1;color:var(--dsw-alias-bg-base);white-space:nowrap}
.dspg-port{position:absolute;top:50%;width:7px;height:7px;margin-top:-3.5px;border-radius:50%;background:var(--dsw-alias-bg-layer-1);border:1.4px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1))}
.dspg-port--in{left:-4px}
.dspg-port--out{right:-4px}
.dspg-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-size:13px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent)}
.dspg-error{color:var(--dsw-alias-state-error-primary)}
.dspg-detail{display:flex;flex-direction:column;gap:8px;flex:none;max-height:172px;overflow:auto;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1))}
.dspg-detail__head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dspg-detail__title{font-size:13px;font-weight:600}
.dspg-detail__hint{font-size:12px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.dspg-detail__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px 18px;margin:0}
.dspg-detail__row{display:flex;gap:8px;min-width:0;font-size:12px}
.dspg-detail__key{flex:none;width:66px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
.dspg-detail__val{margin:0;min-width:0;color:var(--dsw-alias-label-primary);word-break:break-word}
.dspg-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px}
.dspg-legend{flex:none;font-size:12px;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary))}
@keyframes dspg-pulse{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes dspg-flow{to{stroke-dashoffset:-16}}
@keyframes dspg-live-pulse{0%,100%{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary),0 0 10px 1px color-mix(in srgb,var(--dsw-alias-brand-primary) 50%,transparent)}50%{box-shadow:0 0 0 4px var(--dsw-alias-brand-primary),0 0 22px 6px color-mix(in srgb,var(--dsw-alias-brand-primary) 78%,transparent)}}
`;

    /* ------------------------------------------------------------------ *
     * Small helpers
     * ------------------------------------------------------------------ */

    function createStore(initial) {
      let value = initial;
      const listeners = new Set();
      return {
        get() { return value; },
        set(next) {
          if (Object.is(next, value)) return;
          value = next;
          for (const listener of Array.from(listeners)) listener();
        },
        subscribe(listener) {
          listeners.add(listener);
          return () => { listeners.delete(listener); };
        },
      };
    }

    function useStore(store) {
      return useSyncExternalStore(
        useCallback((listener) => store.subscribe(listener), [store]),
        useCallback(() => store.get(), [store]),
      );
    }

    function messageOf(error) {
      if (error === undefined || error === null) return 'error';
      if (typeof error === 'string') return error;
      return error.message || error.name || error.code || 'error';
    }

    function clip(value, max) {
      const text = value === undefined || value === null ? '' : String(value).replace(/\s+/g, ' ').trim();
      return text.length > max ? text.slice(0, max - 1) + '…' : text;
    }

    function elapsedText(startedMs, nowMs) {
      if (typeof startedMs !== 'number' || startedMs < 1e12) return '';
      const ms = (nowMs || Date.now()) - startedMs;
      if (ms < 0) return '';
      return ms < 1000 ? ms + ' ms' : (ms / 1000).toFixed(1) + ' s';
    }

    function formatMs(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return '0 ms';
      return ms < 1000 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(1) + ' s';
    }

    function toolCallIdOf(data) {
      if (data === undefined || data === null) return null;
      if (typeof data.callId === 'string') return data.callId;
      if (typeof data.toolCallId === 'string') return data.toolCallId;
      const content = data.message && data.message.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part && typeof part.toolCallId === 'string') return part.toolCallId;
        }
      }
      return null;
    }

    /** The untouched shared state; a plugin reload reuses it instead of resetting the panel. */
    function ensureShared() {
      let value;
      try { value = globalThis[SHARED_KEY]; } catch (error) { value = undefined; }
      if (value !== undefined && value !== null && value.store !== undefined) return value;
      let open = false;
      try { open = globalThis.sessionStorage.getItem(OPEN_STORAGE_KEY) === '1'; } catch (error) { open = false; }
      /* The panel keeps the size and place the user dragged it to. */
      let geometry = { x: null, y: null, w: 1180, h: 720 };
      try {
        const raw = globalThis.sessionStorage.getItem(GEOMETRY_KEY);
        if (typeof raw === 'string' && raw !== '') {
          const parsed = JSON.parse(raw);
          if (parsed !== null && typeof parsed === 'object') {
            geometry = {
              x: typeof parsed.x === 'number' ? parsed.x : null,
              y: typeof parsed.y === 'number' ? parsed.y : null,
              w: typeof parsed.w === 'number' ? parsed.w : 1180,
              h: typeof parsed.h === 'number' ? parsed.h : 720,
            };
          }
        }
      } catch (error) { /* keep the default frame */ }
      value = {
        store: createStore({ status: 'idle', error: null, presets: [], entries: [], selectedId: null, loadedAt: 0, revision: 0 }),
        liveStore: createStore({
          sessionId: null, title: '', presetId: null, running: false, runningCount: 0,
          phase: 'idle', tool: null, startedAt: null, recentTool: null, turn: null, tools: [], toolStats: {},
          updatedAt: 0, sessions: [],
        }),
        openStore: createStore(open),
        autoStore: createStore(true),
        collapsedStore: createStore(new Set()),
        panelUiStore: createStore(geometry),
        translate: null,
        engine: null,
      };
      try { globalThis[SHARED_KEY] = value; } catch (error) { /* non-writable global */ }
      return value;
    }

    /** Compact technical names, matching the Settings plugin list. */
    function moduleShortName(moduleName) {
      const text = typeof moduleName === 'string' ? moduleName : String(moduleName);
      const unscoped = text.indexOf('@') === 0 ? text.slice(text.indexOf('/') + 1) : text;
      return unscoped
        .replace(/^cordis:/, '')
        .replace(/^cordis-plugin-/, '')
        .replace(/^dsh-(?:host-|client-)?/, '');
    }

    /** Resolve a `LocalizedText` (string or `{ en, [locale] }`) for the active locale. */
    function localizedValue(value, localeId) {
      if (typeof value === 'string') return value;
      if (value === null || typeof value !== 'object') return undefined;
      const direct = value[localeId];
      if (typeof direct === 'string' && direct !== '') return direct;
      if (typeof value.en === 'string' && value.en !== '') return value.en;
      const first = Object.keys(value).find(key => typeof value[key] === 'string' && value[key] !== '');
      return first === undefined ? undefined : value[first];
    }

    /* Package metadata reports either a translated object or a bare module
       specifier, exactly as the Settings plugin list reads it: only an object
       carries display copy, anything else is shortened to its technical name. */
    function pluginText(row, localeId) {
      const title = row.meta === undefined ? undefined : row.meta.title;
      const description = row.meta === undefined ? undefined : row.meta.description;
      const moduleName = row.moduleName;
      const resolved = localizedValue(title, localeId);
      return {
        title: title !== null && typeof title === 'object'
          ? (resolved === undefined || resolved === '' ? moduleShortName(moduleName) : resolved)
          : moduleShortName(typeof title === 'string' && title !== '' ? title : moduleName),
        description: localizedValue(description, localeId),
      };
    }

    /** Enablement of one composition row, as this surface reports it. */
    function statusOf(row) {
      if (row.enabled === false) return 'off';
      if (row.enabled === 'conditional') return 'conditional';
      if (row.fiberPhase === 'failed') return 'failed';
      if (row.fiberPhase === 'pending' || row.fiberPhase === 'loading') return 'pending';
      return 'on';
    }

    /** Capability category of one row, from its module specifier. */
    function categoryOf(moduleName) {
      const short = moduleShortName(moduleName).toLowerCase();
      if (/^tool-subagent|^subagent|^workflow|^tool-workflow|^tool-ralph/.test(short)) return 'delegation';
      if (/^skill-|^tool-skill/.test(short)) return 'skills';
      if (/^command-/.test(short)) return 'commands';
      if (/^compaction|pruner/.test(short)) return 'context';
      if (/^persona|^agent-instructions|^prompt/.test(short)) return 'prompt';
      if (/^plan-mode|^plugin-manager|^permission/.test(short)) return 'control';
      if (/^tool-/.test(short)) return 'tools';
      return 'other';
    }

    /**
     * Plugins this deployment mounts outside the preset.
     *
     * A profile can carry bundles no preset declares (`dsh-tabbit-xww` and
     * friends); their tools are callable by every Session, so the canvas shows
     * them as their own source. Shipped `@deepseek-ai/*` entries are the
     * harness itself and are left out, as is this plugin.
     * @param entries - `PluginInventorySnapshot.entries`.
     * @param preset - the preset being drawn, so its own rows are not repeated.
     * @returns rows shaped like composition rows, for the same node renderer.
     */
    function deployRowsOf(entries, preset) {
      if (!Array.isArray(entries) || entries.length === 0) return [];
      const declared = new Set();
      if (preset !== null && preset !== undefined && Array.isArray(preset.rows)) {
        for (const row of preset.rows) declared.add(row.moduleName);
      }
      const found = [];
      const seen = new Set();
      for (const entry of entries) {
        const name = entry === null || entry === undefined ? undefined : entry.moduleName;
        if (typeof name !== 'string' || name === '') continue;
        if (name.indexOf('@deepseek-ai/') === 0) continue;
        if (name === 'agent-preset-graph-xww') continue;
        if (declared.has(name)) continue;
        if (entry.enabled === false) continue;
        const key = name + '|' + String(entry.entryId);
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({
          entryId: entry.entryId === undefined || entry.entryId === null ? null : String(entry.entryId),
          moduleName: name,
          meta: entry.meta,
          enabled: entry.enabled,
          fiberPhase: entry.fiberPhase,
        });
      }
      return found;
    }

    function bezier(x1, y1, x2, y2) {
      const bend = Math.max(26, Math.abs(x2 - x1) / 2);
      return 'M ' + x1 + ' ' + y1
        + ' C ' + (x1 + bend) + ' ' + y1
        + ', ' + (x2 - bend) + ' ' + y2
        + ', ' + x2 + ' ' + y2;
    }

    /* ------------------------------------------------------------------ *
     * PNG export
     * ------------------------------------------------------------------ */

    function escapeXml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function svgClip(value, max) {
      const text = value === undefined || value === null ? '' : String(value);
      return escapeXml(text.length > max ? text.slice(0, max - 1) + '…' : text);
    }

    /** Resolve one theme token to a concrete color an SVG can carry. */
    function resolveColor(probe, token, fallback) {
      try {
        probe.style.color = '';
        probe.style.color = 'var(' + token + ')';
        const resolved = globalThis.getComputedStyle(probe).color;
        if (typeof resolved === 'string' && resolved !== '' && resolved !== 'rgba(0, 0, 0, 0)') return resolved;
      } catch (error) { /* fall through */ }
      return fallback;
    }

    /**
     * Redraw the laid-out graph as standalone SVG.
     *
     * The on-screen canvas is HTML plus an SVG edge layer, which cannot be
     * rasterised directly; this walks the same layout data instead, so the
     * export needs no extra dependency.
     * @param layout - the built graph.
     * @param live - current highlight, so the picture matches what is on screen.
     * @param color - token resolver bound to a detached probe element.
     * @returns an SVG document string.
     */
    function buildGraphSvg(layout, live, color) {
      const palette = {
        bg: color('--dsw-alias-bg-layer-1', '#1b1b1c'),
        frame: color('--dsw-alias-bg-layer-2', '#232324'),
        node: color('--dsw-alias-bg-layer-1', '#1b1b1c'),
        border: color('--dsw-alias-border-l2', '#3a3a3c'),
        text: color('--dsw-alias-label-primary', '#f9fafb'),
        sub: color('--dsw-alias-label-secondary', '#a1a1aa'),
        live: color('--dsw-alias-brand-primary', '#4c8dff'),
        trail: color('--dsw-alias-state-success-primary', '#22c55e'),
      };
      const parts = [];
      parts.push('<rect x="0" y="0" width="' + layout.width + '" height="' + layout.height + '" fill="' + palette.bg + '"/>');

      for (const edge of layout.edges) {
        const strong = edge.strong === true;
        parts.push('<path d="' + edge.d + '" fill="none" stroke="'
          + (strong ? palette.live : palette.border) + '" stroke-width="' + (strong ? 1.8 : 1.3)
          + '"' + (edge.aux === true ? ' stroke-dasharray="4 5"' : '') + '/>');
      }

      for (const block of layout.blocks) {
        const accent = color('--dsw-alias-border-l1', palette.border);
        parts.push('<rect x="' + block.x + '" y="' + block.y + '" width="' + block.w + '" height="' + block.h
          + '" rx="12" fill="' + palette.frame + '" stroke="' + accent + '" stroke-dasharray="4 4"/>');
        parts.push('<text x="' + (block.x + 24) + '" y="' + (block.y + 19) + '" fill="' + palette.sub
          + '" font-size="11" font-weight="600" letter-spacing="0.5">'
          + svgClip(block.label + '  ' + block.count, 44) + '</text>');
      }

      for (const node of layout.nodes) {
        if (node.hidden === true) continue;
        const isLive = (live.entryId !== null && live.entryId !== undefined
          && node.detail !== undefined && node.detail.entryId === live.entryId)
          || (node.kind === 'call' && live.callLive === true)
          || (node.kind === 'agent' && live.agentLive === true);
        const isTrail = !isLive && live.trail !== undefined && node.detail !== undefined
          && live.trail.has(node.detail.entryId);
        const stroke = isLive ? palette.live : (isTrail ? palette.trail : palette.border);
        const accent = node.accent === undefined ? palette.border : resolveColorToken(color, node.accent, palette.border);
        const pad = 9;
        parts.push('<rect x="' + node.x + '" y="' + node.y + '" width="' + node.w + '" height="' + node.h
          + '" rx="10" fill="' + palette.node + '" stroke="' + stroke + '" stroke-width="' + (isLive ? 2 : 1) + '"/>');
        parts.push('<rect x="' + node.x + '" y="' + node.y + '" width="' + node.w + '" height="' + (isLive ? 4 : 3)
          + '" rx="1.5" fill="' + accent + '"/>');
        parts.push('<text x="' + (node.x + pad) + '" y="' + (node.y + 21) + '" fill="' + palette.text
          + '" font-size="12" font-weight="600">' + svgClip(node.title, node.kind === 'row' ? 22 : 26) + '</text>');
        if (node.sub !== undefined && node.sub !== '') {
          parts.push('<text x="' + (node.x + pad) + '" y="' + (node.y + 37) + '" fill="' + palette.sub
            + '" font-size="10.5">' + svgClip(node.sub, node.kind === 'row' ? 30 : 32) + '</text>');
        }
        if (node.module !== undefined && node.module !== '') {
          parts.push('<text x="' + (node.x + pad) + '" y="' + (node.y + 51) + '" fill="' + palette.sub
            + '" font-size="9.5" font-family="ui-monospace,Menlo,Consolas,monospace">'
            + svgClip(node.module, node.kind === 'row' ? 32 : 30) + '</text>');
        }
      }

      return '<svg xmlns="http://www.w3.org/2000/svg" width="' + layout.width + '" height="' + layout.height
        + '" viewBox="0 0 ' + layout.width + ' ' + layout.height + '">' + parts.join('') + '</svg>';
    }

    /** Node accents are stored as tokens; turn one into a concrete color. */
    function resolveColorToken(color, token, fallback) {
      const match = /^var\((--[a-z0-9-]+)\)$/i.exec(String(token));
      if (match === null) return typeof token === 'string' && token !== '' ? token : fallback;
      return color(match[1], fallback);
    }

    /** Rasterise the graph and hand the user a PNG. */
    function downloadGraphPng(layout, live, done) {
      if (layout === null) {
        if (typeof done === 'function') done(false);
        return;
      }
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.pointerEvents = 'none';
      document.body.appendChild(probe);
      let svg;
      try {
        const color = (token, fallback) => resolveColor(probe, token, fallback);
        svg = buildGraphSvg(layout, live || {}, color);
      } finally {
        document.body.removeChild(probe);
      }

      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      const image = new Image();
      image.onerror = () => {
        URL.revokeObjectURL(url);
        if (typeof done === 'function') done(false);
      };
      image.onload = () => {
        let ok = false;
        try {
          const scale = 2;
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(layout.width * scale);
          canvas.height = Math.round(layout.height * scale);
          const ctx = canvas.getContext('2d');
          if (ctx === null) throw new Error('canvas unavailable');
          ctx.scale(scale, scale);
          ctx.drawImage(image, 0, 0);
          const link = document.createElement('a');
          link.href = canvas.toDataURL('image/png');
          link.download = 'agent-preset-graph.png';
          document.body.appendChild(link);
          link.click();
          link.remove();
          ok = true;
        } catch (error) {
          ok = false;
        } finally {
          URL.revokeObjectURL(url);
          if (typeof done === 'function') done(ok);
        }
      };
      image.src = url;
    }

    /* ------------------------------------------------------------------ *
     * Graph construction
     * ------------------------------------------------------------------ */

    /**
     * Lay out one preset as a left-to-right node canvas.
     * @param preset - one `AgentPresetPluginGroup` from the plugin inventory.
     * @param options - copy resolution for this render.
     * @returns nodes, edges (with a resolved `d` path), category frames and the canvas size.
     */
    function buildGraph(preset, options) {
      const t = options.t;
      const localeId = options.localeId;
      const rows = preset !== null && preset !== undefined && Array.isArray(preset.rows) ? preset.rows : [];

      const buckets = new Map();
      for (const row of rows) {
        const category = categoryOf(row.moduleName);
        if (!buckets.has(category)) buckets.set(category, []);
        buckets.get(category).push(row);
      }
      /* Deployment-level plugins are not rows of this preset, so they get their
         own frame rather than being mixed into a capability category. */
      const deploy = Array.isArray(options.deploy) ? options.deploy : [];
      if (deploy.length > 0) buckets.set('deploy', deploy);

      const categories = CATEGORY_ORDER.filter(id => buckets.has(id));
      const folded = options.collapsed instanceof Set ? options.collapsed : new Set();
      const nodes = [];
      const blocks = [];

      /** Frame height: a folded category keeps only its title bar. */
      const blockHeightOf = (members, isFolded) => {
        if (isFolded) return BLOCK_HEAD + 8;
        const usedCols = Math.max(1, Math.min(BLOCK_COLS, members.length));
        const rowCount = Math.ceil(members.length / usedCols);
        return BLOCK_HEAD + rowCount * (NODE_H + NODE_GAP_Y) - NODE_GAP_Y + BLOCK_PAD;
      };

      const cols = Math.max(1, Math.min(BLOCK_COLS, rows.length || 1));
      const midWidth = Math.max(
        NODE_W + 2 * BLOCK_PAD,
        cols * (NODE_W + NODE_GAP_X) - NODE_GAP_X + 2 * BLOCK_PAD,
      );

      /* Measure the middle band before anything is placed, so both side nodes
         can sit on its vertical centre. */
      const blockHeights = new Map();
      let midHeight = 0;
      for (const category of categories) {
        const height = blockHeightOf(buckets.get(category), folded.has(category));
        blockHeights.set(category, height);
        midHeight += height + BLOCK_GAP;
      }
      if (categories.length > 0) midHeight -= BLOCK_GAP;
      midHeight = Math.max(midHeight, NODE_H);

      const totalHeight = midHeight + 2 * PAD;
      const midX = PAD + SIDE_W + COL_GAP + SIDE_W + COL_GAP;
      const callX = midX + midWidth + COL_GAP;
      const agentX = callX + CALL_W + COL_GAP;
      const totalWidth = agentX + SIDE_W + PAD;
      const sideY = PAD + (midHeight - NODE_H) / 2;

      const entryNodeId = '__entry';
      const presetNodeId = '__preset';
      const callNodeId = '__call';
      const agentNodeId = '__agent';

      nodes.push({
        id: entryNodeId,
        kind: 'entry',
        x: PAD,
        y: sideY,
        w: SIDE_W,
        h: NODE_H,
        title: t('entryTitle'),
        sub: t('entrySub'),
        module: 'session / task',
        status: 'on',
        accent: 'var(--dsw-alias-label-secondary)',
        badge: '',
        detail: {},
      });
      nodes.push({
        id: presetNodeId,
        kind: 'preset',
        x: PAD + SIDE_W + COL_GAP,
        y: sideY,
        w: SIDE_W,
        h: NODE_H,
        title: options.presetName,
        sub: t('presetSub', { n: String(rows.length) }),
        module: preset.id,
        status: preset.broken === undefined ? 'on' : 'failed',
        accent: 'var(--dsw-alias-brand-primary)',
        badge: preset.isDefault === true ? t('presetDefault') : '',
        detail: { description: options.presetDescription },
      });

      let cursorY = PAD;
      for (const category of categories) {
        const all = buckets.get(category);
        const isFolded = folded.has(category);
        /* A folded frame still reports how many rows it holds, but draws none. */
        const members = isFolded ? [] : all;
        const usedCols = Math.max(1, Math.min(BLOCK_COLS, members.length));
        const height = blockHeights.get(category);
        const blockId = '__block:' + category;

        blocks.push({
          id: blockId,
          category,
          x: midX,
          y: cursorY,
          w: midWidth,
          h: height,
          label: t(CATEGORY_LABEL_KEY[category] || 'categoryFallback'),
          count: all.length,
          folded: isFolded,
          accent: CATEGORY_ACCENT[category] || CATEGORY_ACCENT.other,
        });

        members.forEach((row, index) => {
          const column = index % usedCols;
          const line = Math.floor(index / usedCols);
          const text = pluginText(row, localeId);
          const status = statusOf(row);
          const entryText = row.entryId === null || row.entryId === undefined
            ? ''
            : String(row.entryId);
          /* A row whose entry id repeats its title has nothing to add there, so
             the second line carries the package's own description instead. */
          const sub = entryText !== '' && entryText !== text.title
            ? entryText
            : (text.description === undefined ? '' : text.description);
          nodes.push({
            id: '__row:' + category + ':' + String(index),
            kind: 'row',
            category,
            blockId,
            x: midX + BLOCK_PAD + column * (NODE_W + NODE_GAP_X),
            y: cursorY + BLOCK_HEAD + line * (NODE_H + NODE_GAP_Y),
            w: NODE_W,
            h: NODE_H,
            title: text.title,
            sub,
            module: row.moduleName,
            status,
            accent: STATUS_ACCENT[status] || STATUS_ACCENT.on,
            badge: '',
            detail: {
              entryId: row.entryId === null || row.entryId === undefined ? undefined : String(row.entryId),
              moduleName: row.moduleName,
              category: t(CATEGORY_LABEL_KEY[category] || 'categoryFallback'),
              condition: row.condition,
              fiberPhase: row.fiberPhase === null || row.fiberPhase === undefined ? undefined : String(row.fiberPhase),
              description: text.description,
              status,
            },
          });
        });

        cursorY += height + BLOCK_GAP;
      }

      /* The call node is the Agent's working edge: whatever runs right now lands
         here, including a tool that no row of this preset declares. */
      nodes.push({
        id: callNodeId,
        kind: 'call',
        x: callX,
        y: sideY,
        w: CALL_W,
        h: NODE_H,
        title: t('callTitle'),
        sub: t('callIdle'),
        module: 'tool call',
        status: 'on',
        accent: 'var(--dsw-alias-label-secondary)',
        badge: '',
        detail: {},
      });
      nodes.push({
        id: agentNodeId,
        kind: 'agent',
        x: agentX,
        y: sideY,
        w: SIDE_W,
        h: NODE_H,
        title: t('agentTitle'),
        sub: t('agentSub'),
        module: 'agent loop',
        status: 'on',
        accent: 'var(--dsw-alias-brand-primary)',
        badge: '',
        detail: {},
      });

      /* A category frame is not a node, but it carries the same two anchors:
         its right edge feeds the Agent loop and its left edge is fed by the
         preset, so a block participates in the flow without being a box. */
      const anchors = new Map();
      for (const node of nodes) {
        anchors.set(node.id, { outX: node.x + node.w, inX: node.x, midY: node.y + node.h / 2 });
      }
      for (const block of blocks) {
        anchors.set(block.id, { outX: block.x + block.w, inX: block.x, midY: block.y + block.h / 2 });
      }

      const edges = [];
      const pushEdge = (fromId, toId, strong, aux) => {
        const from = anchors.get(fromId);
        const to = anchors.get(toId);
        if (from === undefined || to === undefined) return;
        edges.push({
          id: fromId + '->' + toId,
          from: fromId,
          to: toId,
          d: bezier(from.outX, from.midY, to.inX, to.midY),
          x2: to.inX,
          y2: to.midY,
          strong: strong === true,
          aux: aux === true,
        });
      };

      pushEdge(entryNodeId, presetNodeId, true);
      for (const block of blocks) {
        /* The deployment frame is not the preset's to hand out, so it is wired
           weakly: a real input to the run, but no claim of preset ownership. */
        const aux = block.category === 'deploy';
        pushEdge(presetNodeId, block.id, false, aux);
        pushEdge(block.id, callNodeId, false, aux);
      }
      pushEdge(callNodeId, agentNodeId, true);

      /* Totals come from the composition, not from the frames on screen, so
         folding a category never changes the numbers. */
      const presetRows = [];
      const deployRows = [];
      for (const [category, list] of buckets) {
        if (category === 'deploy') deployRows.push(...list);
        else presetRows.push(...list);
      }
      const countStatus = (list, wanted) => list.filter(row => statusOf(row) === wanted).length;
      return {
        nodes,
        blocks,
        edges,
        agentNodeId,
        width: Math.max(totalWidth, 420),
        height: Math.max(totalHeight, 260),
        stats: {
          total: presetRows.length,
          on: countStatus(presetRows, 'on'),
          off: countStatus(presetRows, 'off'),
          conditional: countStatus(presetRows, 'conditional'),
          deploy: deployRows.length,
        },
      };
    }

    /* ------------------------------------------------------------------ *
     * Live state: which preset this Session runs and what it is doing now
     * ------------------------------------------------------------------ */

    /**
     * The composition row a tool name belongs to, resolved against the graph
     * actually on screen.
     *
     * The table covers the shipped tools; anything else (a third-party plugin's
     * tool) falls back to the tool's first word, which normally names the plugin
     * that contributes it. Resolving against the layout also keeps the highlight
     * honest: a tool only lights a node the displayed preset really declares.
     * @param toolName - the model-facing tool name from `tool/call`.
     * @param layout - the graph currently rendered, or null.
     * @returns the entry id to highlight, or null.
     */
    function resolveToolEntry(toolName, layout) {
      if (typeof toolName !== 'string' || toolName === '') return null;
      const known = TOOL_ENTRY[toolName];
      const rows = layout === null ? null : layout.nodes.filter(node => node.kind === 'row');
      if (known !== undefined) {
        if (rows === null) return known;
        return rows.some(node => node.detail !== undefined && node.detail.entryId === known) ? known : null;
      }
      if (rows === null) return null;
      const stem = toolName.split('_')[0].toLowerCase();
      if (stem.length < 3) return null;
      for (const node of rows) {
        const entry = node.detail !== undefined && node.detail.entryId !== undefined ? String(node.detail.entryId) : '';
        const haystack = (entry + ' ' + String(node.module || '')).toLowerCase();
        if (haystack.indexOf(stem) !== -1) return entry === '' ? null : entry;
      }
      return null;
    }

    /**
     * Fold a Session's event tail into "what is happening right now".
     * @param entries - the retained event window.
     * @param running - whether the Session's Agent currently runs.
     * @returns the tool in flight (if any), the last one seen, and the phase.
     */
    function liveFrom(entries, running) {
      const tail = Array.isArray(entries)
        ? (entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries)
        : [];
      const pending = [];
      const calls = [];
      let lastTool = null;
      let lastTurn = null;

      for (const entry of tail) {
        if (entry === null || entry === undefined || entry.type !== 'event') continue;
        const event = entry.event;
        if (event === null || event === undefined || typeof event.type !== 'string') continue;
        const data = event.data || {};
        if (event.type === 'tool/call') {
          const name = typeof data.name === 'string' ? data.name : 'tool';
          const turn = typeof data.turn === 'number' ? data.turn : null;
          const call = { name, callId: toolCallIdOf(data), at: typeof event.time === 'number' ? event.time : null, turn, ms: null };
          pending.push(call);
          calls.push(call);
          lastTool = call;
          if (turn !== null) lastTurn = turn;
        } else if (event.type === 'tool/result') {
          const callId = toolCallIdOf(data);
          let index = -1;
          if (callId !== null) {
            for (let i = 0; i < pending.length; i++) {
              if (pending[i].callId === callId) { index = i; break; }
            }
          }
          /* Many results carry no usable callId, so pairing falls back to the
             oldest call still awaiting one rather than dropping the duration. */
          if (index < 0 && pending.length > 0) index = 0;
          if (index >= 0) {
            const finished = pending[index];
            pending.splice(index, 1);
            if (finished.at !== null && typeof event.time === 'number' && event.time >= finished.at) {
              finished.ms = event.time - finished.at;
            }
          }
        }
      }

      const active = pending.length > 0 ? pending[pending.length - 1] : null;
      const current = running ? active : null;
      /* The turn in flight plus every tool it has reached for so far: the canvas
         paints that as a trail, so a long turn reads as a path rather than a
         single blinking box. */
      const inTurn = lastTurn === null
        ? calls.slice(-12)
        : calls.filter(call => call.turn === lastTurn);
      /* Per-tool totals for this turn: how often, how long, and how many are
         still in flight. */
      const toolStats = {};
      for (const call of inTurn) {
        const entry = toolStats[call.name] || (toolStats[call.name] = { count: 0, ms: 0, running: 0 });
        entry.count += 1;
        if (typeof call.ms === 'number') entry.ms += call.ms;
        else entry.running += 1;
      }
      return {
        phase: !running ? 'idle' : (current === null ? 'model' : (WAITING_TOOLS[current.name] === true ? 'waiting' : 'tool')),
        tool: current === null ? null : current.name,
        startedAt: current === null ? null : current.at,
        recentTool: lastTool === null || current !== null ? null : lastTool.name,
        turn: lastTurn,
        tools: inTurn.map(call => call.name),
        toolStats,
      };
    }

    /** Watches the Session catalog and, while the panel is open, one Session's event window. */
    function createEngine(ctx, shared) {
      const refs = new Map();
      let active = false;
      let preferredId = null;
      let timer = null;
      let disposed = false;
      let publishing = false;

      function catalogRows() {
        try {
          const snapshot = ctx.sessions.list.getSnapshot();
          const ids = Array.isArray(snapshot && snapshot.ids) ? snapshot.ids : [];
          const byId = (snapshot && snapshot.byId) || {};
          const rows = [];
          for (const id of ids) {
            const row = byId[id];
            if (row) rows.push(row);
          }
          return rows;
        } catch (error) {
          return [];
        }
      }

      function pickSession(rows) {
        if (preferredId !== null && rows.some(row => row.id === preferredId)) return preferredId;
        const roots = rows.filter(row => !row.parentId);
        const pool = roots.length > 0 ? roots : rows;
        if (pool.length === 0) return null;
        const running = pool.filter(row => row.running);
        const candidates = (running.length > 0 ? running : pool).slice();
        candidates.sort((a, b) => (a.updatedAt || 0) < (b.updatedAt || 0) ? 1 : -1);
        return candidates[0].id;
      }

      function schedule() {
        if (disposed || timer !== null) return;
        timer = setTimeout(() => { timer = null; publish(); }, PUBLISH_DELAY);
      }

      function syncRefs(ids) {
        for (const [id, entry] of Array.from(refs)) {
          if (ids.indexOf(id) !== -1) continue;
          try { if (entry.unsubscribe) entry.unsubscribe(); } catch (error) { /* already gone */ }
          try { entry.reference.release(); } catch (error) { /* already gone */ }
          refs.delete(id);
        }
        for (const id of ids) {
          if (refs.has(id)) continue;
          let reference;
          try { reference = ctx.sessions.retain(id, { source: SOURCE }); } catch (error) { continue; }
          const entry = {
            reference,
            unsubscribe: null,
            entries() {
              try {
                const snapshot = reference.binding.eventSource.getSnapshot();
                return (snapshot && snapshot.entries) || [];
              } catch (error) {
                return [];
              }
            },
          };
          refs.set(id, entry);
          const attach = () => {
            if (entry.unsubscribe || disposed) return;
            try {
              entry.unsubscribe = reference.binding.eventSource.subscribe(schedule);
              schedule();
            } catch (error) { /* binding not ready yet; `ready` retries once */ }
          };
          attach();
          if (reference.ready && typeof reference.ready.then === 'function') {
            reference.ready.then(() => { attach(); schedule(); }, () => {});
          }
        }
      }

      function publish() {
        if (disposed || publishing) return;
        publishing = true;
        try {
          const rows = catalogRows();
          const runningCount = rows.filter(row => row.running).length;
          const sessionId = active ? pickSession(rows) : null;
          const row = sessionId === null ? null : rows.find(candidate => candidate.id === sessionId) || null;

          if (sessionId === null) {
            syncRefs([]);
            shared.liveStore.set({
              sessionId: null, title: '', presetId: null, running: false, runningCount,
              phase: 'idle', tool: null, startedAt: null,
              recentTool: null, turn: null, tools: [], toolStats: {}, updatedAt: Date.now(),
              sessions: rows.map(item => ({
                id: item.id,
                label: clip(item.displayTitle || item.id, 40),
                running: Boolean(item.running),
              })),
            });
            return;
          }

          preferredId = sessionId;
          syncRefs([sessionId]);
          const entry = refs.get(sessionId);
          const live = liveFrom(entry === undefined ? [] : entry.entries(), Boolean(row && row.running));
          const projection = row && row.projectionValues ? row.projectionValues.agentPreset : undefined;

          shared.liveStore.set({
            sessionId,
            title: row ? clip(row.displayTitle || row.id, 48) : sessionId,
            presetId: typeof projection === 'string' ? projection : null,
            running: Boolean(row && row.running),
            runningCount,
            phase: live.phase,
            tool: live.tool,
            startedAt: live.startedAt,
            recentTool: live.recentTool,
            turn: live.turn,
            tools: live.tools,
            toolStats: live.toolStats,
            updatedAt: Date.now(),
            sessions: rows.map(item => ({
              id: item.id,
              label: clip(item.displayTitle || item.id, 40),
              running: Boolean(item.running),
            })),
          });
        } finally {
          publishing = false;
        }
      }

      return {
        catalogChanged() {
          if (active) schedule();
          else publish();
        },
        setActive(next) {
          if (active === next) return;
          active = next;
          if (active) publish();
          else { syncRefs([]); publish(); }
        },
        select(sessionId) { preferredId = sessionId; publish(); },
        refresh() { publish(); },
        dispose() {
          disposed = true;
          if (timer !== null) { clearTimeout(timer); timer = null; }
          syncRefs([]);
        },
      };
    }

    /* ------------------------------------------------------------------ *
     * Canvas
     * ------------------------------------------------------------------ */

    function ports(kind) {
      if (kind === 'entry') return [h('span', { key: 'out', className: 'dspg-port dspg-port--out' })];
      if (kind === 'agent') return [h('span', { key: 'in', className: 'dspg-port dspg-port--in' })];
      if (kind === 'preset' || kind === 'call') {
        return [
          h('span', { key: 'in', className: 'dspg-port dspg-port--in' }),
          h('span', { key: 'out', className: 'dspg-port dspg-port--out' }),
        ];
      }
      return [];
    }

    function NodeCard({ node, selected, onSelect, state, liveLabel, dim, hit }) {
      const wide = node.kind === 'entry' || node.kind === 'preset'
        || node.kind === 'agent' || node.kind === 'call';
      const className = 'dspg-node'
        + (wide ? ' dspg-node--wide' : '')
        + (selected ? ' is-selected' : '')
        + (state === 'live' ? ' is-live' : '')
        + (state === 'trail' ? ' is-trail' : '')
        + (dim === true ? ' is-dim' : '')
        + (hit === true ? ' is-hit' : '');
      const badge = state === 'live' ? liveLabel : node.badge;
      const badgeAccent = state === 'live' ? 'var(--dsw-alias-brand-primary)' : node.accent;
      const select = () => { if (node.kind === 'row') onSelect(node.id); };
      return h('div', {
        className,
        style: { left: node.x + 'px', top: node.y + 'px', width: node.w + 'px', height: node.h + 'px' },
        role: node.kind === 'row' ? 'button' : undefined,
        tabIndex: node.kind === 'row' ? 0 : undefined,
        'aria-pressed': node.kind === 'row' ? (selected ? 'true' : 'false') : undefined,
        title: node.module === undefined ? node.title : node.title + ' — ' + node.module,
        onPointerDown: (event) => { event.stopPropagation(); },
        onClick: select,
        onKeyDown: (event) => {
          if (node.kind !== 'row') return;
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); }
        },
      },
        h('div', { className: 'dspg-node__bar', style: { background: node.accent } }),
        h('div', { className: 'dspg-node__body' },
          h('div', { className: 'dspg-node__top' },
            h('span', { className: 'dspg-node__title' }, node.title),
            badge === '' || badge === undefined
              ? null
              : h('span', { className: 'dspg-badge', style: { background: badgeAccent } }, badge),
          ),
          node.sub === undefined || node.sub === '' ? null : h('div', { className: 'dspg-node__sub' }, node.sub),
          node.module === undefined || node.module === '' ? null : h('div', { className: 'dspg-node__module' }, node.module),
        ),
        ports(node.kind),
      );
    }

    function BlockFrame({ block, live, onToggle }) {
      const toggle = () => { if (typeof onToggle === 'function') onToggle(block.category); };
      return h('div', {
        className: 'dspg-block' + (live ? ' is-live' : '') + (block.folded === true ? ' is-folded' : ''),
        style: { left: block.x + 'px', top: block.y + 'px', width: block.w + 'px', height: block.h + 'px' },
      },
        h('div', {
          className: 'dspg-block__head',
          role: 'button',
          tabIndex: 0,
          'aria-expanded': block.folded === true ? 'false' : 'true',
          onPointerDown: (event) => { event.stopPropagation(); },
          onClick: toggle,
          onKeyDown: (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            toggle();
          },
        },
          h('span', { className: 'dspg-block__fold' }, block.folded === true ? '▶' : '▼'),
          h('span', { className: 'dspg-block__dot', style: { background: block.accent } }),
          h('span', { className: 'dspg-block__label' }, block.label),
          h('span', { className: 'dspg-block__count' }, String(block.count)),
        ),
      );
    }

    /**
     * The zoomable, pannable canvas plus its zoom controls.
     * @param props - layout, selection, live highlight and the host's own toolbar content.
     */
    function GraphView(props) {
      const { layout, t, selectedId, onSelect, toolbarStart, toolbarEnd, tall, fill } = props;
      const auto = props.auto === true;
      const showAuto = props.showAuto === true;
      const onAutoChange = props.onAutoChange;
      const now = props.now;
      const live = props.live || {};
      const collapsed = props.collapsed;
      const onToggleCategory = props.onToggleCategory;
      const entryStats = props.entryStats;
      const onExport = props.onExport;
      const onCollapseAll = props.onCollapseAll;
      const viewportRef = useRef(null);
      const panRef = useRef(null);
      const downPoint = useRef(null);
      const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
      const [panning, setPanning] = useState(false);
      const [query, setQuery] = useState('');
      const fittedKey = useRef('');

      const fit = useCallback((showAll) => {
        const el = viewportRef.current;
        if (el === null || layout === null) return;
        const width = el.clientWidth;
        const height = el.clientHeight;
        if (width < 2 || height < 2) return;
        const whole = Math.min(width / layout.width, height / layout.height, 1);
        const clamped = showAll !== true && whole < READABLE_FIT;
        const scale = clamped ? READABLE_FIT : whole;
        /* A clamped default view opens at the flow's top-left corner — the task
           entry, the preset and the first block — rather than centring a canvas
           whose text would then be too small to read. */
        setView({
          scale,
          x: clamped ? PAD * scale : (width - layout.width * scale) / 2,
          y: clamped ? PAD * scale : (height - layout.height * scale) / 2,
        });
      }, [layout]);

      /* Fit on first paint and when the composition itself changes. Folding a
         category must not throw the camera back to the top-left corner, so the
         key is the preset's identity, not the current node count. */
      useLayoutEffect(() => {
        if (layout === null) return;
        const key = props.layoutKey === undefined || props.layoutKey === null
          ? 'default'
          : String(props.layoutKey);
        if (fittedKey.current === key) return;
        fittedKey.current = key;
        fit(false);
      }, [fit, layout, props.layoutKey]);

      const zoomBy = useCallback((factor) => {
        const el = viewportRef.current;
        if (el === null) return;
        setView((current) => {
          const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
          const k = scale / current.scale;
          const px = el.clientWidth / 2;
          const py = el.clientHeight / 2;
          return { scale, x: px - (px - current.x) * k, y: py - (py - current.y) * k };
        });
      }, []);

      /* Wheel zoom is registered natively: React's synthetic wheel listener
         cannot opt out of passive scrolling. */
      useEffect(() => {
        const el = viewportRef.current;
        if (el === null) return undefined;
        const onWheel = (event) => {
          event.preventDefault();
          const rect = el.getBoundingClientRect();
          const px = event.clientX - rect.left;
          const py = event.clientY - rect.top;
          const factor = Math.exp(-event.deltaY * 0.0016);
          setView((current) => {
            const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor));
            const k = scale / current.scale;
            return { scale, x: px - (px - current.x) * k, y: py - (py - current.y) * k };
          });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => { el.removeEventListener('wheel', onWheel); };
      }, [layout === null ? '' : 'ready']);

      const onPointerDown = (event) => {
        if (event.button !== 0) return;
        const el = viewportRef.current;
        if (el === null) return;
        try { el.setPointerCapture(event.pointerId); } catch (error) { /* unsupported */ }
        panRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: view.x, oy: view.y };
        downPoint.current = { x: event.clientX, y: event.clientY };
        setPanning(true);
      };
      const onPointerMove = (event) => {
        const pan = panRef.current;
        if (pan === null || pan.id !== event.pointerId) return;
        setView((current) => ({ scale: current.scale, x: pan.ox + (event.clientX - pan.x), y: pan.oy + (event.clientY - pan.y) }));
      };
      const onPointerUp = (event) => {
        const pan = panRef.current;
        if (pan === null || pan.id !== event.pointerId) return;
        panRef.current = null;
        setPanning(false);
        const el = viewportRef.current;
        if (el !== null) { try { el.releasePointerCapture(event.pointerId); } catch (error) { /* unsupported */ } }

        /* A press that did not travel is a click on the background, not a drag:
           it drops the selection, which in turn folds the detail panel away and
           gives the canvas its space back. */
        const start = downPoint.current;
        downPoint.current = null;
        if (start === null) return;
        if (Math.abs(event.clientX - start.x) > 4 || Math.abs(event.clientY - start.y) > 4) return;
        const target = event.target;
        const onControl = target !== null && target !== undefined
          && typeof target.closest === 'function'
          && target.closest('.dspg-node, .dspg-block__head') !== null;
        if (!onControl && typeof onSelect === 'function') onSelect(null);
      };

      /* Where the work is right now, for the Auto follow camera. The call node
         wins over the Agent loop: it names the actual step in flight. */
      const focusNode = useMemo(() => {
        if (layout === null) return null;
        if (live.entryId !== null && live.entryId !== undefined) {
          const found = layout.nodes.find(node => node.detail !== undefined && node.detail.entryId === live.entryId);
          if (found !== undefined) return found;
        }
        if (live.callLive === true) {
          const call = layout.nodes.find(node => node.kind === 'call');
          if (call !== undefined) return call;
        }
        if (live.agentLive === true) {
          const agent = layout.nodes.find(node => node.kind === 'agent');
          if (agent !== undefined) return agent;
        }
        return null;
      }, [layout, live.entryId, live.callLive, live.agentLive]);
      const focusId = focusNode === null ? null : focusNode.id;
      const focusRef = useRef(null);
      focusRef.current = focusNode;

      /** Centre the canvas on the node the work is in, at a readable zoom. */
      const centreOnFocus = useCallback(() => {
        const node = focusRef.current;
        const el = viewportRef.current;
        if (node === null || el === null) return;
        const width = el.clientWidth;
        const height = el.clientHeight;
        if (width < 2 || height < 2) return;
        setView((current) => {
          const scale = Math.max(current.scale, 1);
          return {
            scale,
            x: width / 2 - (node.x + node.w / 2) * scale,
            y: height / 2 - (node.y + node.h / 2) * scale,
          };
        });
      }, []);

      /* Auto follow moves only when the work moves on — not when the layout
         changes under it (folding a category must not yank the camera away from
         what the user is looking at); the Locate button drives the same camera. */
      useEffect(() => {
        if (!auto || focusId === null) return;
        centreOnFocus();
      }, [auto, focusId, centreOnFocus]);

      /* Node filter: a 40-node canvas is quicker to read by name than by eye. */
      const needle = query.trim().toLowerCase();
      const filtering = needle !== '';
      const matched = useMemo(() => {
        const ids = new Set();
        if (layout === null || needle === '') return ids;
        for (const node of layout.nodes) {
          if (node.kind !== 'row') continue;
          const entry = node.detail === undefined || node.detail.entryId === undefined ? '' : String(node.detail.entryId);
          const haystack = (node.title + ' ' + String(node.module === undefined ? '' : node.module) + ' ' + entry).toLowerCase();
          if (haystack.indexOf(needle) !== -1) ids.add(node.id);
        }
        return ids;
      }, [layout, needle]);

      /* Every frame on the canvas, and whether they are all folded — the one
         control that flips the whole graph between "outline" and "full". */
      const blockCategories = useMemo(
        () => (layout === null ? [] : layout.blocks.map(block => block.category)),
        [layout],
      );
      const allFolded = blockCategories.length > 0
        && collapsed !== undefined && collapsed !== null
        && blockCategories.every(category => collapsed.has(category));

      const selected = useMemo(() => {
        if (layout === null || selectedId === null) return null;
        return layout.nodes.find(node => node.id === selectedId) || null;
      }, [layout, selectedId]);

      const selectedStats = useMemo(() => {
        if (selected === null || selected.detail === undefined || selected.detail.entryId === undefined) return null;
        if (entryStats === undefined || entryStats === null) return null;
        return entryStats.get(selected.detail.entryId) || null;
      }, [selected, entryStats]);

      const nodeState = (node) => {
        if (node.kind === 'call') return live.callLive === true ? 'live' : null;
        if (node.kind === 'agent') return live.agentLive === true ? 'live' : null;
        if (live.entryId !== null && live.entryId !== undefined && node.detail !== undefined && node.detail.entryId === live.entryId) return 'live';
        if (live.trail !== undefined && node.detail !== undefined && live.trail.has(node.detail.entryId)) return 'trail';
        return null;
      };

      /* The call node's face is runtime data: which tool, and for how long. */
      const callFace = useMemo(() => {
        const running = live.callLive === true;
        if (!running) {
          return { title: t('callTitle'), sub: t('callIdle'), accent: 'var(--dsw-alias-label-secondary)' };
        }
        const label = typeof live.tool === 'string' && live.tool !== '' ? live.tool : t('callModel');
        const elapsed = elapsedText(live.startedAt, now);
        return {
          title: label,
          sub: elapsed === '' ? t('callRunning') : elapsed,
          accent: 'var(--dsw-alias-brand-primary)',
        };
      }, [live.callLive, live.tool, live.startedAt, now, t]);

      const liveBlockId = useMemo(() => {
        if (layout === null || live.entryId === null || live.entryId === undefined) return null;
        const node = layout.nodes.find(candidate => candidate.detail !== undefined && candidate.detail.entryId === live.entryId);
        return node === undefined ? null : node.blockId;
      }, [layout, live.entryId]);

      /* The path the work is travelling. While a step runs, the edge into the
         Agent loop always flows; when the step maps to a preset row, that row's
         category frame and its two edges flow as well. */
      const liveEdges = useMemo(() => {
        const ids = new Set();
        if (layout === null) return ids;
        for (const edge of layout.edges) {
          if (live.callLive === true && edge.to === '__agent') { ids.add(edge.id); continue; }
          if (liveBlockId === null || liveBlockId === undefined) continue;
          if (edge.from === liveBlockId || edge.to === liveBlockId) ids.add(edge.id);
        }
        return ids;
      }, [layout, liveBlockId, live.callLive]);

      const stats = layout === null ? null : layout.stats;

      return h('div', { className: 'dspg-graph' + (fill === true ? ' dspg-graph--fill' : '') },
        h('div', { className: 'dspg-toolbar' },
          toolbarStart,
          h('button', { type: 'button', className: 'dspg-button', onClick: () => { zoomBy(1 / 0.8); }, title: t('zoomOut'), 'aria-label': t('zoomOut') }, '−'),
          h('button', { type: 'button', className: 'dspg-button', onClick: () => { zoomBy(0.8); }, title: t('zoomIn'), 'aria-label': t('zoomIn') }, '+'),
          h('button', { type: 'button', className: 'dspg-button', onClick: () => { fit(true); } }, t('fit')),
          h('button', {
            type: 'button',
            className: 'dspg-button',
            onClick: centreOnFocus,
            disabled: focusId === null,
            title: t('locateTitle'),
            'aria-label': t('locateTitle'),
          }, t('locate')),
          h('button', {
            type: 'button',
            className: 'dspg-button',
            onClick: () => { if (typeof onCollapseAll === 'function') onCollapseAll(!allFolded, blockCategories); },
            disabled: blockCategories.length === 0,
            title: allFolded ? t('expandAll') : t('collapseAll'),
          }, allFolded ? t('expandAll') : t('collapseAll')),
          h('button', {
            type: 'button',
            className: 'dspg-button',
            onClick: () => { if (typeof onExport === 'function') onExport(); },
            disabled: layout === null,
            title: t('exportTitle'),
            'aria-label': t('exportTitle'),
          }, t('exportPng')),
          showAuto
            ? h('label', { className: 'dspg-check', title: t('autoFollowTitle') },
                h('input', {
                  type: 'checkbox',
                  checked: auto,
                  onChange: (event) => {
                    if (typeof onAutoChange === 'function') onAutoChange(event.target.checked);
                  },
                }),
                t('autoFollow'),
              )
            : null,
          h('input', {
            type: 'search',
            className: 'dspg-search',
            placeholder: t('searchPlaceholder'),
            title: t('searchTitle'),
            value: query,
            onChange: (event) => { setQuery(event.target.value); },
          }),
          stats === null ? null : h('span', { className: 'dspg-stats' },
            h('span', null, t('nodeCount', { n: String(stats.total) })),
            h('span', null, t('onCount', { n: String(stats.on) })),
            stats.off > 0 ? h('span', null, t('offCount', { n: String(stats.off) })) : null,
            stats.conditional > 0 ? h('span', null, t('condCount', { n: String(stats.conditional) })) : null,
            stats.deploy > 0 ? h('span', null, t('deployCount', { n: String(stats.deploy) })) : null,
          ),
          toolbarEnd,
        ),
        h('div', { className: 'dspg-canvas' + (tall ? ' dspg-canvas--tall' : '') },
          h('div', { className: 'dspg-grid' }),
          h('div', {
            className: 'dspg-viewport' + (panning ? ' is-panning' : ''),
            ref: viewportRef,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
          },
            layout === null
              ? null
              : h('div', {
                  className: 'dspg-world',
                  style: {
                    width: layout.width + 'px',
                    height: layout.height + 'px',
                    transform: 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.scale + ')',
                    /* Animated while the camera follows the work, instant while
                       the user drags (a transition there feels like elastic). */
                    transition: panning ? 'none' : 'transform .3s ease',
                  },
                },
                h('svg', {
                  className: 'dspg-edges',
                  width: layout.width,
                  height: layout.height,
                  viewBox: '0 0 ' + layout.width + ' ' + layout.height,
                  'aria-hidden': true,
                },
                  layout.edges.map((edge) => {
                    const liveEdge = liveEdges.has(edge.id);
                    const base = edge.strong === true ? 'is-strong' : (edge.aux === true ? 'is-aux' : undefined);
                    return h('g', { key: edge.id },
                      h('path', { d: edge.d, className: liveEdge ? 'is-live' : base }),
                      h('circle', {
                        cx: edge.x2,
                        cy: edge.y2,
                        r: 2.6,
                        className: liveEdge ? 'is-live' : (edge.strong === true ? 'is-strong' : undefined),
                      }),
                    );
                  }),
                ),
                layout.blocks.map(block => h(BlockFrame, {
                  key: block.id,
                  block,
                  live: block.id === liveBlockId,
                  onToggle: onToggleCategory,
                })),
                layout.nodes.map((node) => h(NodeCard, {
                  key: node.id,
                  node: node.kind === 'call'
                    ? { ...node, title: callFace.title, sub: callFace.sub, accent: callFace.accent }
                    : node,
                  selected: node.id === selectedId,
                  onSelect,
                  state: nodeState(node),
                  liveLabel: t('liveBadge'),
                  dim: filtering && node.kind === 'row' && !matched.has(node.id),
                  hit: filtering && matched.has(node.id),
                })),
              ),
          ),
          props.overlay,
        ),
        selected === null ? null : h(DetailPanel, { node: selected, t, stats: selectedStats }),
      );
    }

    function DetailPanel({ node, t, stats }) {
      if (node === null || node === undefined || node.kind !== 'row') {
        return h('div', { className: 'dspg-detail' },
          h('div', { className: 'dspg-detail__hint' }, t('detailHint')),
        );
      }
      const detail = node.detail || {};
      const statusText = {
        on: t('statusOn'),
        off: t('statusOff'),
        conditional: t('statusConditional'),
        failed: t('statusFailed'),
        pending: t('statusPending'),
      }[detail.status] || t('statusOn');
      const fields = [
        ['fEntryId', detail.entryId, true],
        ['fModule', detail.moduleName, true],
        ['fCategory', detail.category, false],
        ['fStatus', statusText, false],
        ['fCondition', detail.condition, true],
        ['fFiber', detail.fiberPhase, true],
        ['fDescription', detail.description, false],
      ].filter(entry => entry[1] !== undefined && entry[1] !== null && entry[1] !== '');
      return h('div', { className: 'dspg-detail' },
        h('div', { className: 'dspg-detail__head' },
          h('span', { style: { background: node.accent, width: '14px', height: '3px', borderRadius: '2px', display: 'inline-block' } }),
          h('span', { className: 'dspg-detail__title' }, node.title),
          h('span', { className: 'dspg-badge', style: { background: node.accent } }, statusText),
        ),
        h('div', { className: 'dspg-detail__grid' },
          fields.map(entry => h('div', { className: 'dspg-detail__row', key: entry[0] },
            h('span', { className: 'dspg-detail__key' }, t(entry[0])),
            h('span', { className: 'dspg-detail__val' + (entry[2] === true ? ' dspg-mono' : '') }, String(entry[1])),
          )),
        ),
        h('div', { className: 'dspg-stat' },
          h('span', { className: stats !== null && stats !== undefined && stats.count > 0 ? 'dspg-stat__hit' : undefined },
            stats !== null && stats !== undefined && stats.count > 0
              ? t('statCalls', { n: String(stats.count) })
              : t('statNone')),
          stats !== null && stats !== undefined && stats.ms > 0
            ? h('span', null, t('statTime', { t: formatMs(stats.ms) }))
            : null,
          stats !== null && stats !== undefined && stats.running > 0
            ? h('span', null, t('statRunning', { n: String(stats.running) }))
            : null,
        ),
      );
    }

    /* ------------------------------------------------------------------ *
     * Shared preset resolution
     * ------------------------------------------------------------------ */

    function presetById(state, id) {
      if (id === null || id === undefined) return null;
      return state.presets.find(row => row.id === id) || null;
    }

    function usePresetCopy(shared, preset) {
      const state = useStore(shared.store);
      return useMemo(() => {
        if (preset === null) return { name: '', description: undefined };
        const keys = preset.name === undefined ? BUILT_IN_PRESET_KEYS[preset.id] : undefined;
        if (keys !== undefined && typeof shared.presetCopy === 'function') {
          return { name: shared.presetCopy(keys.name), description: shared.presetCopy(keys.description) };
        }
        return { name: preset.name === undefined ? preset.id : preset.name, description: preset.description };
        /* `state.revision` bumps on load and on a locale switch. */
      }, [preset, shared, state.revision]);
    }

    function presetDisplayName(shared, row) {
      const keys = row.name === undefined ? BUILT_IN_PRESET_KEYS[row.id] : undefined;
      if (keys !== undefined && typeof shared.presetCopy === 'function') return shared.presetCopy(keys.name);
      return row.name === undefined ? row.id : row.name;
    }

    function presetOptionLabel(shared, row) {
      return presetDisplayName(shared, row) + (row.isDefault === true ? ' ★' : '');
    }

    /* ------------------------------------------------------------------ *
     * Surface 1: the sidebar entry, directly above Settings
     * ------------------------------------------------------------------ */

    function GraphIcon(props) {
      const size = props && props.size ? props.size : 18;
      return h('svg', {
        className: 'dspg-trigger__icon', viewBox: '0 0 24 24', width: size, height: size,
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.6,
        strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
      },
        h('rect', { x: 2, y: 9.5, width: 5.4, height: 5, rx: 1.4 }),
        h('rect', { x: 16.6, y: 3.6, width: 5.4, height: 5, rx: 1.4 }),
        h('rect', { x: 16.6, y: 15.4, width: 5.4, height: 5, rx: 1.4 }),
        h('path', { d: 'M7.4 12h4.6V6.1h4.6' }),
        h('path', { d: 'M12 12v5.9h4.6' }),
      );
    }

    function GraphTrigger(props) {
      const shared = ensureShared();
      const open = useStore(shared.openStore);
      const live = useStore(shared.liveStore);
      const t = shared.translate === null ? ((key) => key) : shared.translate;
      const wide = !props || props.wide !== false;
      const count = live.runningCount || 0;
      return h('button', {
        type: 'button',
        className: 'dspg-trigger' + (wide ? '' : ' dspg-trigger--rail'),
        'aria-pressed': open ? 'true' : 'false',
        'aria-label': count > 0 ? t('triggerBadge', { n: String(count) }) : t('trigger'),
        title: count > 0 ? t('trigger') + ' · ' + t('triggerBadge', { n: String(count) }) : t('trigger'),
        onClick: () => {
          const next = !shared.openStore.get();
          shared.openStore.set(next);
          try { globalThis.sessionStorage.setItem(OPEN_STORAGE_KEY, next ? '1' : '0'); } catch (error) { /* storage unavailable */ }
          if (typeof shared.setEngineActive === 'function') shared.setEngineActive(next);
        },
      },
        h(GraphIcon, { size: 18 }),
        wide ? h('span', { className: 'dspg-trigger__label' }, t('trigger')) : null,
        count > 0 ? h('span', { className: 'dspg-trigger__badge' }, String(count)) : null,
      );
    }

    /* ------------------------------------------------------------------ *
     * Surface 2: the live panel
     * ------------------------------------------------------------------ */

    function LiveBar({ live, t, now, presetName }) {
      const phase = live.phase || 'idle';
      let text = t('liveIdle');
      if (phase === 'model') text = t('liveModel');
      else if (phase === 'tool') text = t('liveTool', { name: live.tool });
      else if (phase === 'waiting') text = t('liveWaiting', { name: live.tool });
      else if (live.recentTool !== null && live.recentTool !== undefined) text = t('liveRecent', { name: live.recentTool });
      const elapsed = (phase === 'tool' || phase === 'waiting') ? elapsedText(live.startedAt, now) : '';
      return h('div', { className: 'dspg-live dspg-live--' + phase },
        h('span', { className: 'dspg-live__dot' }),
        h('span', { className: 'dspg-live__text' }, text),
        elapsed === '' ? null : h('span', { className: 'dspg-live__meta' }, elapsed),
        live.turn === null || live.turn === undefined
          ? null
          : h('span', { className: 'dspg-live__meta' }, t('liveTurn', { n: String(live.turn) })),
        h('span', { className: 'dspg-live__sep' }),
        h('span', { className: 'dspg-live__meta' }, presetName),
        h('span', { className: 'dspg-live__meta' }, t('liveSession', { title: live.title || '—' })),
      );
    }

    function ConversationGraphView() {
      const shared = ensureShared();
      const open = useStore(shared.openStore);
      const live = useStore(shared.liveStore);
      const state = useStore(shared.store);
      const geometry = useStore(shared.panelUiStore);
      const auto = useStore(shared.autoStore);
      const collapsed = useStore(shared.collapsedStore);

      const onToggleCategory = useCallback((category) => {
        const next = new Set(shared.collapsedStore.get());
        if (next.has(category)) next.delete(category);
        else next.add(category);
        shared.collapsedStore.set(next);
      }, [shared]);

      /** Fold or unfold every frame the canvas currently shows. */
      const onCollapseAll = useCallback((fold, categories) => {
        shared.collapsedStore.set(fold === true && Array.isArray(categories) ? new Set(categories) : new Set());
      }, [shared]);
      const t = shared.translate === null ? ((key) => key) : shared.translate;
      const localeId = shared.localeId === undefined ? 'zh' : shared.localeId;

      /* Two unrelated selections: which preset to draw, and which node's detail
         is open. Sharing one state meant picking a node re-pointed the preset. */
      const [presetChoice, setPresetChoice] = useState(null);
      const [selectedId, setSelectedId] = useState(null);
      const [now, setNow] = useState(() => Date.now());
      const [note, setNote] = useState(null);
      const dragRef = useRef(null);
      const resizeRef = useRef(null);
      const panelRef = useRef(null);
      const lastAutoLoad = useRef(0);
      const lastSession = useRef(null);

      /* A different Session runs a different preset, so the manual choice stops
         applying and the canvas follows the new Session's own composition. */
      useEffect(() => {
        if (lastSession.current === live.sessionId) return;
        lastSession.current = live.sessionId;
        setPresetChoice(null);
      }, [live.sessionId]);

      /* Keep the frame the user dragged and resized the panel to. */
      useEffect(() => {
        try { globalThis.sessionStorage.setItem(GEOMETRY_KEY, JSON.stringify(geometry)); } catch (error) { /* storage unavailable */ }
      }, [geometry]);

      /* Mounting this view is what makes the live event window worth retaining:
         the settings browser, and a graph nobody is looking at, cost nothing. */
      useEffect(() => {
        if (typeof shared.setEngineActive === 'function') shared.setEngineActive(true);
        return () => {
          if (typeof shared.setEngineActive === 'function') shared.setEngineActive(false);
        };
      }, [shared]);

      /* The panel is the usual entry point, so it also owns making sure the
         roster is there rather than relying on the Settings surface. */
      useEffect(() => {
        if (state.status === 'ready' && Date.now() - state.loadedAt < 4000) return;
        if (lastAutoLoad.current !== 0 && Date.now() - lastAutoLoad.current < 1000) return;
        lastAutoLoad.current = Date.now();
        if (typeof shared.load === 'function') void shared.load();
      }, [shared, state.status, state.loadedAt]);

      /* A live duration needs a ticking clock; nothing else here is time-based. */
      useEffect(() => {
        const timer = setInterval(() => { setNow(Date.now()); }, 1000);
        return () => { clearInterval(timer); };
      }, []);

      const preset = useMemo(() => {
        const preferred = presetChoice === null ? live.presetId : presetChoice;
        const found = presetById(state, preferred);
        if (found !== null) return found;
        return state.presets.find(row => row.isDefault === true) || state.presets[0] || null;
      }, [state, live.presetId, presetChoice]);

      const copy = usePresetCopy(shared, preset);

      const layout = useMemo(() => {
        if (preset === null) return null;
        return buildGraph(preset, {
          t,
          localeId,
          presetName: copy.name,
          presetDescription: copy.description,
          deploy: deployRowsOf(state.entries, preset),
          collapsed,
        });
      }, [preset, t, localeId, copy, state.revision, state.entries, collapsed]);

      /* The highlight belongs to the Session's own preset: while the user is
         browsing a different one, nothing on the canvas is "running". */
      const liveProp = useMemo(() => {
        const idle = {
          entryId: null, trail: new Set(), agentLive: false, callLive: false, tool: null, startedAt: null,
        };
        const showingSessionPreset = preset !== null && live.presetId !== null && preset.id === live.presetId;
        if (!showingSessionPreset) return idle;
        const running = live.running === true;
        /* Every node this turn has already reached, so the path walked stays
           visible behind the one being walked right now. */
        const trail = new Set();
        for (const name of Array.isArray(live.tools) ? live.tools : []) {
          const entry = resolveToolEntry(name, layout);
          if (entry !== null) trail.add(entry);
        }
        const active = resolveToolEntry(live.tool, layout);
        if (active !== null) trail.delete(active);
        return {
          entryId: active,
          trail,
          /* The loop lights up while the model is thinking; a running tool lights
             the call node, which covers tools that no preset row declares too. */
          agentLive: running && live.phase === 'model',
          callLive: running,
          tool: live.tool,
          startedAt: live.startedAt,
        };
      }, [live, preset, layout]);

      /* What this turn did to each node, keyed by entry id so the detail panel
         can show it for the node the user actually selected. */
      const entryStats = useMemo(() => {
        const map = new Map();
        const stats = live.toolStats;
        if (stats === null || typeof stats !== 'object') return map;
        for (const name of Object.keys(stats)) {
          const entry = resolveToolEntry(name, layout);
          if (entry === null) continue;
          const add = stats[name];
          const previous = map.get(entry) || { count: 0, ms: 0, running: 0 };
          map.set(entry, {
            count: previous.count + add.count,
            ms: previous.ms + add.ms,
            running: previous.running + add.running,
          });
        }
        return map;
      }, [live.toolStats, layout]);

      const exportPng = useCallback(() => {
        const finish = (ok) => {
          setNote(ok ? t('exportDone') : t('exportFailed', { reason: 'PNG' }));
          globalThis.setTimeout(() => { setNote(null); }, 2600);
        };
        try {
          downloadGraphPng(layout, liveProp, finish);
        } catch (error) {
          finish(false);
        }
      }, [layout, liveProp, t]);

      const onPointerDown = useCallback((event) => {
        if (event.button !== 0) return;
        const target = event.target;
        if (target && target.closest && target.closest('button, select, .dspg-canvas')) return;
        const el = panelRef.current;
        if (el === null) return;
        const rect = el.getBoundingClientRect();
        dragRef.current = {
          id: event.pointerId,
          dx: event.clientX - rect.left,
          dy: event.clientY - rect.top,
          w: rect.width,
          h: rect.height,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }, []);

      const onPointerMove = useCallback((event) => {
        const drag = dragRef.current;
        if (drag === null || drag.id !== event.pointerId) return;
        shared.panelUiStore.set({
          ...shared.panelUiStore.get(),
          x: event.clientX - drag.dx,
          y: event.clientY - drag.dy,
          w: drag.w,
          h: drag.h,
        });
      }, [shared]);

      const onPointerUp = useCallback((event) => {
        const drag = dragRef.current;
        if (drag === null || drag.id !== event.pointerId) return;
        dragRef.current = null;
      }, []);

      const onResizeDown = useCallback((event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        const el = panelRef.current;
        if (el === null) return;
        const rect = el.getBoundingClientRect();
        resizeRef.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          w: rect.width,
          h: rect.height,
          left: rect.left,
          top: rect.top,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }, []);

      const onResizeMove = useCallback((event) => {
        const resize = resizeRef.current;
        if (resize === null || resize.id !== event.pointerId) return;
        shared.panelUiStore.set({
          ...shared.panelUiStore.get(),
          x: resize.left,
          y: resize.top,
          w: Math.max(560, resize.w + (event.clientX - resize.x)),
          h: Math.max(380, resize.h + (event.clientY - resize.y)),
        });
      }, [shared]);

      const onResizeUp = useCallback((event) => {
        const resize = resizeRef.current;
        if (resize === null || resize.id !== event.pointerId) return;
        resizeRef.current = null;
      }, []);

      const sessions = Array.isArray(live.sessions) ? live.sessions : [];
      const sessionPreset = presetById(state, live.presetId);
      const sessionPresetLabel = live.presetId === null
        ? t('liveNoPreset')
        : t('livePreset', { name: sessionPreset === null ? live.presetId : presetDisplayName(shared, sessionPreset) });

      const toolbarStart = h('label', { className: 'dspg-field' },
        t('presetSelect'),
        h('select', {
          className: 'dspg-select',
          value: preset === null ? '' : preset.id,
          onChange: (event) => { setPresetChoice(event.target.value); },
        },
          state.presets.length === 0
            ? h('option', { value: '' }, '—')
            : state.presets.map(row => h('option', { key: row.id, value: row.id }, presetOptionLabel(shared, row))),
        ),
      );

      const sessionPicker = sessions.length === 0 ? null : h('label', { className: 'dspg-field' },
        t('sessionSelect'),
        h('select', {
          className: 'dspg-select',
          value: live.sessionId === null ? '' : live.sessionId,
          onChange: (event) => { if (typeof shared.selectSession === 'function') shared.selectSession(event.target.value); },
        },
          sessions.map(row => h('option', { key: row.id, value: row.id }, (row.running ? '● ' : '○ ') + row.label)),
        ),
      );

      const overlay = state.status === 'error'
        ? h('div', { className: 'dspg-overlay dspg-error' }, t('failed', { reason: state.error || 'error' }))
        : (preset !== null && preset.broken !== undefined
          ? h('div', { className: 'dspg-overlay dspg-error' }, t('brokenPreset', { reason: preset.broken }))
          : (state.presets.length === 0 ? h('div', { className: 'dspg-overlay' }, t('empty')) : null));

      return h('div', { className: 'dspg-view' },
        h('style', null, CSS),
        h('div', { className: 'dspg-view__head' },
          h(GraphIcon, { size: 16 }),
          h('span', { className: 'dspg-panel__title' }, t('panelTitle')),
          h('span', { className: 'dspg-panel__spacer' }),
          sessionPicker,
          h('button', {
            type: 'button',
            className: 'dspg-button',
            title: t('refresh'),
            onClick: () => {
              if (typeof shared.load === 'function') void shared.load();
              if (typeof shared.refreshLive === 'function') shared.refreshLive();
            },
          }, t('refresh')),
        ),
        h('div', { className: 'dspg-panel__body' },
          h(LiveBar, { live, t, now, presetName: sessionPresetLabel }),
          layout === null && state.status === 'loading'
            ? h('div', { className: 'dspg-detail' }, h('div', { className: 'dspg-detail__hint' }, t('loading')))
            : h(GraphView, {
                layout,
                t,
                selectedId,
                onSelect: setSelectedId,
                live: liveProp,
                now,
                toolbarStart,
                overlay,
                fill: true,
                auto,
                showAuto: true,
                onAutoChange: (next) => { shared.autoStore.set(next === true); },
                collapsed,
                onToggleCategory,
                onCollapseAll,
                entryStats,
                layoutKey: preset === null ? '' : preset.id,
                onExport: exportPng,
                toolbarEnd: note === null ? null : h('span', { className: 'dspg-note' }, note),
              }),
          h('p', { className: 'dspg-legend' }, t('collapseHint')),
        ),
      );
    }

    /* ------------------------------------------------------------------ *
     * Surface 3: the Settings browser
     * ------------------------------------------------------------------ */

    function SettingsSection() {
      const shared = ensureShared();
      const state = useStore(shared.store);
      const t = shared.translate === null ? ((key) => key) : shared.translate;
      const localeId = shared.localeId === undefined ? 'zh' : shared.localeId;
      /* The node whose detail is open is a separate state from the preset the
         picker shows. */
      const [presetChoice, setPresetChoice] = useState(null);
      const [selectedId, setSelectedId] = useState(null);
      const lastAutoLoad = useRef(0);
      const collapsed = useStore(shared.collapsedStore);

      const onToggleCategory = useCallback((category) => {
        const next = new Set(shared.collapsedStore.get());
        if (next.has(category)) next.delete(category);
        else next.add(category);
        shared.collapsedStore.set(next);
      }, [shared]);

      /** Fold or unfold every frame the canvas currently shows. */
      const onCollapseAll = useCallback((fold, categories) => {
        shared.collapsedStore.set(fold === true && Array.isArray(categories) ? new Set(categories) : new Set());
      }, [shared]);

      const preset = useMemo(() => {
        const preferred = presetChoice === null ? state.selectedId : presetChoice;
        const found = presetById(state, preferred);
        return found === null ? (state.presets[0] || null) : found;
      }, [state, presetChoice]);

      const copy = usePresetCopy(shared, preset);

      const layout = useMemo(() => {
        if (preset === null) return null;
        return buildGraph(preset, {
          t,
          localeId,
          presetName: copy.name,
          presetDescription: copy.description,
          deploy: deployRowsOf(state.entries, preset),
          collapsed,
        });
      }, [preset, t, localeId, copy, state.revision, state.entries, collapsed]);

      useEffect(() => {
        if (state.status === 'ready' && Date.now() - state.loadedAt < 4000) return;
        if (lastAutoLoad.current !== 0 && Date.now() - lastAutoLoad.current < 1000) return;
        lastAutoLoad.current = Date.now();
        if (typeof shared.load === 'function') void shared.load();
      }, [shared, state.status, state.loadedAt]);

      const toolbarStart = h('label', { className: 'dspg-field' },
        t('presetSelect'),
        h('select', {
          className: 'dspg-select',
          value: preset === null ? '' : preset.id,
          onChange: (event) => { setPresetChoice(event.target.value); },
        },
          state.presets.length === 0
            ? h('option', { value: '' }, '—')
            : state.presets.map(row => h('option', { key: row.id, value: row.id }, presetOptionLabel(shared, row))),
        ),
      );

      const overlay = state.status === 'loading' && state.presets.length === 0
        ? h('div', { className: 'dspg-overlay' }, t('loading'))
        : (state.status === 'error'
          ? h('div', { className: 'dspg-overlay dspg-error' }, t('failed', { reason: state.error || 'error' }))
          : (state.presets.length === 0
            ? h('div', { className: 'dspg-overlay' }, t('empty'))
            : (preset !== null && preset.broken !== undefined
              ? h('div', { className: 'dspg-overlay dspg-error' }, t('brokenPreset', { reason: preset.broken }))
              : null)));

      return h('div', { className: 'dspg-section' },
        h('style', null, CSS),
        h('div', { className: 'dspg-head' },
          h('h2', { className: 'dspg-title' }, t('title')),
          h('p', { className: 'dspg-intro' }, t('intro')),
        ),
        h(GraphView, {
          layout,
          t,
          selectedId,
          onSelect: setSelectedId,
          live: {},
          toolbarStart,
          toolbarEnd: h('button', {
            type: 'button',
            className: 'dspg-button',
            onClick: () => { if (typeof shared.load === 'function') void shared.load(); },
          }, t('refresh')),
          overlay,
          tall: true,
          collapsed,
          onToggleCategory,
          onCollapseAll,
          layoutKey: preset === null ? '' : preset.id,
        }),
        h('p', { className: 'dspg-legend' }, t('legend')),
      );
    }

    /* ------------------------------------------------------------------ *
     * Plugin body
     * ------------------------------------------------------------------ */

    function currentLocaleId(ctx) {
      try {
        const snapshot = ctx.locale.getLocale();
        if (snapshot !== null && snapshot !== undefined && typeof snapshot.id === 'string') return snapshot.id;
      } catch (error) { /* fall through */ }
      try {
        const snapshot = ctx.locale.getSnapshot();
        if (snapshot !== null && snapshot !== undefined && typeof snapshot.id === 'string') return snapshot.id;
      } catch (error) { /* fall through */ }
      return 'zh';
    }

    function makeTranslate(ctx) {
      let bound = null;
      try { bound = ctx.locale.bind(NS); } catch (error) { bound = null; }
      return (key, params) => {
        let text;
        if (bound !== null) {
          try { text = bound(key, params); } catch (error) { text = undefined; }
        }
        if (typeof text !== 'string' || text === '' || text === key) {
          const dictionary = currentLocaleId(ctx) === 'en' ? EN : ZH;
          text = dictionary[key] === undefined ? key : dictionary[key];
        }
        if (params !== undefined && params !== null) {
          for (const name of Object.keys(params)) text = text.split('{' + name + '}').join(String(params[name]));
        }
        return text;
      };
    }

    return {
      inject: ['slots', 'locale', 'sessions', 'remote', 'remote.pluginInventory'],

      apply(ctx) {
        const shared = ensureShared();
        const t = makeTranslate(ctx);
        shared.translate = t;
        shared.localeId = currentLocaleId(ctx);

        /* Shipped-preset copy lives in the agent-preset dictionaries. */
        let presetCopy = null;
        try { presetCopy = ctx.locale.bind('settings.agentPreset'); } catch (error) { presetCopy = null; }
        shared.presetCopy = typeof presetCopy === 'function' ? presetCopy : null;

        shared.selectSession = (id) => { if (engine !== null) engine.select(id); };
        shared.refreshLive = () => { if (engine !== null) engine.refresh(); };
        shared.setEngineActive = (next) => { if (engine !== null) engine.setActive(next); };

        shared.load = async () => {
          const current = shared.store.get();
          shared.store.set({ ...current, status: 'loading', error: null });
          try {
            const result = await ctx.remote.pluginInventory.list();
            if (result === null || result === undefined || result.ok !== true) {
              const error = result === null || result === undefined ? undefined : result.error;
              throw new Error(error === undefined ? 'pluginInventory.list failed' : (error.message || error.code || 'error'));
            }
            const value = result.value || {};
            const presets = Array.isArray(value.agentPresets) ? value.agentPresets : [];
            /* The whole Loader inventory, so a deployment-level plugin can be
               told apart from the preset's own rows. */
            const entries = Array.isArray(value.entries) ? value.entries : [];
            const previous = shared.store.get().selectedId;
            const fallback = presets.find(row => row.isDefault === true) || presets[0];
            const selectedId = presets.some(row => row.id === previous)
              ? previous
              : (fallback === undefined ? null : fallback.id);
            shared.store.set({
              status: 'ready',
              error: null,
              presets,
              entries,
              selectedId,
              loadedAt: Date.now(),
              revision: shared.store.get().revision + 1,
            });
          } catch (error) {
            shared.store.set({ ...shared.store.get(), status: 'error', error: messageOf(error), loadedAt: Date.now() });
          }
        };

        ctx.effect(() => {
          const disposers = [];
          try { disposers.push(ctx.locale.register(NS, 'zh', ZH)); } catch (error) { /* dictionary already present */ }
          try { disposers.push(ctx.locale.register(NS, 'en', EN)); } catch (error) { /* dictionary already present */ }
          return () => {
            for (const dispose of disposers) {
              try { dispose(); } catch (error) { /* already gone */ }
            }
          };
        }, 'agent-preset-graph: dictionaries');

        /* A locale switch re-resolves this surface's copy and the shipped preset
           names, so re-render every mounted canvas. */
        ctx.effect(() => {
          if (typeof ctx.locale.subscribe !== 'function') return () => {};
          return ctx.locale.subscribe(() => {
            shared.localeId = currentLocaleId(ctx);
            shared.store.set({ ...shared.store.get(), revision: shared.store.get().revision + 1 });
          });
        }, 'agent-preset-graph: locale follow');

        /* ---- live engine -------------------------------------------------- */

        const engine = createEngine(ctx, shared);
        /* A reload activates a second instance; retire the previous engine so its
         * session references and timers do not outlive it. */
        if (shared.engine !== null && shared.engine !== undefined && shared.engine !== engine
          && typeof shared.engine.dispose === 'function') {
          try { shared.engine.dispose(); } catch (error) { /* already gone */ }
        }
        shared.engine = engine;

        /* The roster is small and every surface needs it, so read it once at
           activation rather than waiting for a panel to open. */
        void shared.load();

        ctx.effect(() => {
          const unsubscribe = ctx.sessions.list.subscribe(() => { engine.catalogChanged(); });
          engine.catalogChanged();
          return () => { unsubscribe(); };
        }, 'agent-preset-graph: session catalog');

        /* Activation follows the conversation view's mount; the settings
           browser reads the same stores but keeps the event window released. */

        ctx.effect(() => () => {
          engine.dispose();
          if (shared.engine === engine) shared.engine = null;
        }, 'agent-preset-graph: engine');

        /* ---- surfaces ----------------------------------------------------- */

        /* A conversation view tab, registered after Trajectory so it sits to
           its right in the tab strip. */
        ctx.slots.inject('conversation.view', () => ctx.slots.register({
          name: 'conversation.view',
          id: SURFACE_ID,
          order: 20,
          label: () => t('viewTab'),
        }, ConversationGraphView));

        /* Ordered right after the Agent-preset section it explains. */
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: SURFACE_ID,
          order: 21,
          label: () => t('nav'),
        }, SettingsSection));
      },
    };
  },
});
