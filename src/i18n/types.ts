export interface Translations {
  nav: {
    features: string;
    liveDemo: string;
    howItWorks: string;
    github: string;
    tryDemo: string;
  };
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    subtitle: string;
    ctaTryDemo: string;
    ctaAddDiscord: string;
    botName: string;
    botStatus: string;
    botQuote: string;
  };
  features: {
    label: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    items: {
      title: string;
      description: string;
    }[];
  };
  howItWorks: {
    label: string;
    title: string;
    titleHighlight: string;
    steps: {
      title: string;
      description: string;
    }[];
  };
  demo: {
    label: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    personas: {
      hype: string;
      coach: string;
      roast: string;
    };
    voiceLabel: string;
    loadingVoices: string;
    selectVoice: string;
    noVoices: string;
    clickMic: string;
    listening: string;
    processing: string;
    speaking: string;
    youSaid: string;
    loadingFalcon: string;
  };
  footer: {
    builtWith: string;
  };
  languageSwitcher: {
    search: string;
    noResults: string;
  };
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir?: "ltr" | "rtl";
}
