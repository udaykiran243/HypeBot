import { Translations } from "../types";
export const zh: Translations = {
  nav: { features: "功能", liveDemo: "实时演示", howItWorks: "工作原理", github: "GitHub", tryDemo: "试用演示" },
  hero: { badge: "由 Murf Falcon 驱动 — ~130ms 延迟", titleLine1: "你的AI", titleLine2: "加油员", titleLine3: "在Discord上", subtitle: "一个加入你语音频道的Discord机器人，作为实时评论员、生产力教练或犀利的代码审查员——全部实时语音。", ctaTryDemo: "试用实时演示", ctaAddDiscord: "添加到 Discord", botName: "HypeBot", botStatus: "● 在线语音中", botQuote: '"哟！最后一次提交太棒了 🔥 干净的重构，正确的类型，零警告。你今天真不一样！"' },
  features: { label: "功能", title: "为", titleHighlight: "实时", subtitle: "你需要的一切，让AI同事真正在Discord上与你交谈。", items: [{ title: "实时语音", description: "加入你的Discord语音频道，使用Murf Falcon的超低延迟TTS即时回复。" }, { title: "~130ms响应", description: "Falcon的超快推理实现自然、不间断的对话流。" }, { title: "GitHub吐槽", description: "连接webhooks，获得实时语音公告，赞美或吐槽你的提交。" }, { title: "多种人设", description: "在加油员、严格教练、代码审查员之间切换，或创建你自己的个性。" }, { title: "语音转文字", description: "实时聆听你的声音，理解上下文，智能回应。" }, { title: "生产力模式", description: "番茄钟计时器公告、站会提醒和专注会话指导。" }] },
  howItWorks: { label: "工作原理", title: "几", titleHighlight: "分钟", steps: [{ title: "邀请HypeBot", description: "一键将HypeBot添加到你的Discord服务器。授予语音频道权限。" }, { title: "加入语音频道", description: "HypeBot检测到你在语音频道中并自动加入（或通过命令）。" }, { title: "开始交谈", description: "自然地说话。HypeBot通过STT聆听，AI处理，并在~130ms内用Murf Falcon TTS回应。" }, { title: "连接GitHub", description: "可选：链接你的仓库。HypeBot实时语音播报提交、PR和CI结果。" }] },
  demo: { label: "实时演示", title: "与", titleHighlight: "HypeBot交谈", subtitle: "点击麦克风，说些什么，听你的AI同事用Murf Falcon的超低延迟语音回应。", personas: { hype: "🔥 加油员", coach: "🎯 严格教练", roast: "💀 代码吐槽" }, voiceLabel: "🦅 Murf Falcon 语音", loadingVoices: "加载语音...", selectVoice: "选择Falcon语音", noVoices: "未找到Falcon语音。请检查API密钥。", clickMic: "点击麦克风并说话", listening: "正在听...点击停止", processing: "Falcon AI处理中...", speaking: "HypeBot正在通过Murf Falcon说话...", youSaid: "你说了:", loadingFalcon: "加载Falcon语音..." },
  footer: { builtWith: "使用 Murf Falcon 构建 • Hackathon 2026" },
  languageSwitcher: { search: "搜索语言...", noResults: "未找到语言" },
};
