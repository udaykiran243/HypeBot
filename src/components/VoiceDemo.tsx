import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Bot, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n";

type DemoState = "idle" | "listening" | "processing" | "speaking";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface FalconVoice {
  voice_id: string;
  display_name: string;
  gender: string;
  locale: string;
  styles?: string[];
}

const personas = [
  { id: "hype", label: "🔥 Hype Man", prompt: "You are an extremely enthusiastic hype man. Respond with high energy, slang, and excitement to whatever the user says. Keep it short (2-3 sentences max)." },
  { id: "coach", label: "🎯 Strict Coach", prompt: "You are a strict but caring productivity coach. Give tough-love feedback. Be direct and motivating. Keep it short (2-3 sentences max)." },
  { id: "roast", label: "💀 Code Roaster", prompt: "You are a sarcastic code reviewer who roasts everything (lovingly). Be witty and funny. Keep it short (2-3 sentences max)." },
];

// Map i18n language codes to Murf locale prefixes
const langToLocalePrefix: Record<string, string> = {
  en: "en", es: "es", fr: "fr", de: "de", pt: "pt", it: "it", nl: "nl",
  ru: "ru", pl: "pl", uk: "uk", cs: "cs", sv: "sv", da: "da", fi: "fi",
  no: "no", tr: "tr", el: "el", ro: "ro", hu: "hu", zh: "zh", ja: "ja",
  ko: "ko", ar: "ar", hi: "hi", bn: "bn", th: "th", vi: "vi", id: "id",
  ms: "ms", tl: "tl", he: "he", fa: "fa", ur: "ur", sw: "sw", bg: "bg",
  hr: "hr", sk: "sk", lt: "lt", lv: "lv", et: "et", ca: "ca", te: "te",
};

// Map i18n codes to BCP-47 for SpeechRecognition
const langToSpeechLang: Record<string, string> = {
  en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR", it: "it-IT",
  nl: "nl-NL", ru: "ru-RU", pl: "pl-PL", uk: "uk-UA", cs: "cs-CZ", sv: "sv-SE",
  da: "da-DK", fi: "fi-FI", no: "no-NO", tr: "tr-TR", el: "el-GR", ro: "ro-RO",
  hu: "hu-HU", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR", ar: "ar-SA", hi: "hi-IN",
  bn: "bn-IN", th: "th-TH", vi: "vi-VN", id: "id-ID", ms: "ms-MY", tl: "fil-PH",
  he: "he-IL", fa: "fa-IR", ur: "ur-PK", sw: "sw-KE", bg: "bg-BG", hr: "hr-HR",
  sk: "sk-SK", lt: "lt-LT", lv: "lv-LV", et: "et-EE", ca: "ca-ES", te: "te-IN",
};

const VoiceDemo = () => {
  const { t, language } = useI18n();
  const [state, setState] = useState<DemoState>("idle");
  const [activePersonaId, setActivePersonaId] = useState("hype");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [falconVoices, setFalconVoices] = useState<FalconVoice[]>([]);
  const [selectedFalconVoice, setSelectedFalconVoice] = useState<FalconVoice | null>(null);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pick the best voice for a given language code from the voice list
  const pickVoiceForLang = useCallback((voices: FalconVoice[], langCode: string): FalconVoice | null => {
    if (voices.length === 0) return null;
    const prefix = langToLocalePrefix[langCode] || langCode;
    const match = voices.find(v => v.locale.startsWith(prefix));
    if (match) return match;
    // Fallback to English
    const enFallback = voices.find(v => v.locale.startsWith("en"));
    return enFallback || voices[0];
  }, []);

  // Load Falcon voices on mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoadingVoices(true);
        const { data, error } = await supabase.functions.invoke('murf-voices');
        if (error) throw error;

        const voiceList: FalconVoice[] = (data || []).map((v: any) => ({
          voice_id: v.voice_id || v.voiceId || v.name,
          display_name: v.display_name || v.displayName || v.name || v.voice_id,
          gender: v.gender || 'Unknown',
          locale: v.locale || v.language || 'en-US',
          styles: v.available_styles || v.styles || [],
        }));

        setFalconVoices(voiceList);
        if (voiceList.length > 0) {
          setSelectedFalconVoice(pickVoiceForLang(voiceList, language.code));
        }
      } catch (err) {
        console.error('Failed to load Falcon voices:', err);
        setError('Could not load Murf Falcon voices. Check your API key.');
      } finally {
        setLoadingVoices(false);
      }
    };
    fetchVoices();
  }, []);

  // Auto-switch voice when language changes
  useEffect(() => {
    if (falconVoices.length > 0) {
      setSelectedFalconVoice(pickVoiceForLang(falconVoices, language.code));
    }
  }, [language.code, falconVoices, pickVoiceForLang]);

  const playFalconAudio = useCallback(async (text: string) => {
    if (!selectedFalconVoice) {
      setError('No voice selected');
      setState('idle');
      return;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('murf-tts', {
        body: {
          text,
          voiceId: selectedFalconVoice.voice_id,
        },
        // We need the raw response for audio binary
      });

      if (fnError) throw fnError;

      // data is returned as a Blob or base64 depending on the response
      let audioBlob: Blob;
      if (data instanceof Blob) {
        audioBlob = data;
      } else if (data instanceof ArrayBuffer) {
        audioBlob = new Blob([data], { type: 'audio/mpeg' });
      } else {
        // If it's returned as JSON with error
        if (data?.error) throw new Error(data.error);
        throw new Error('Unexpected response format');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setState('idle');
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setError('Failed to play audio');
        setState('idle');
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('Falcon TTS error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
      setState('idle');
    }
  }, [selectedFalconVoice]);

  const startListening = useCallback(() => {
    setError("");
    setResponse("");
    setTranscript("");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = langToSpeechLang[language.code] || "en-US";
    recognitionRef.current = recognition;

    recognition.onstart = () => setState("listening");

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setTranscript(current);
    };

    recognition.onend = () => {
      setState("processing");

      // Generate persona-based response text
      const responses: Record<string, string[]> = {
        hype: [
          "YOOOO that was STRAIGHT FIRE! You're absolutely crushing it right now, keep that energy UP!",
          "BRO you just said something LEGENDARY! The whole server needs to hear this, you're built DIFFERENT!",
          "LETS GOOOO! That energy is IMMACULATE! You're the main character today and NOBODY can tell you otherwise!",
        ],
        coach: [
          "Good input. But are you DOING the work or just TALKING about it? Clock's ticking. Get back to it.",
          "I hear you. Now close Discord, open your IDE, and ship something in the next 25 minutes. No excuses.",
          "That's a solid thought. Now channel it into action. Your standup is in 2 hours. Have something to show.",
        ],
        roast: [
          "Wow, groundbreaking. I've seen more innovation in a TODO comment. But hey, at least you're talking to a bot about it.",
          "That's certainly words in a sequence. Have you considered that your rubber duck might give better feedback?",
          "Interesting take. Almost as interesting as your last commit message: fix stuff. Real descriptive. Chef's kiss.",
        ],
      };

      const personaResponses = responses[activePersonaId] || responses.hype;
      const randomResponse = personaResponses[Math.floor(Math.random() * personaResponses.length)];
      setResponse(randomResponse);
      setState("speaking");

      // Use Murf Falcon for TTS
      playFalconAudio(randomResponse);
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setError(`Mic error: ${e.error}. Please allow microphone access.`);
      setState("idle");
    };

    recognition.start();
  }, [activePersonaId, playFalconAudio]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return (
    <section id="demo" className="py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />

      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm font-mono text-accent mb-3 tracking-wider uppercase">{t.demo.label}</p>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            {t.demo.title}<span className="text-gradient-blurple">{t.demo.titleHighlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t.demo.subtitle}
          </p>
        </motion.div>

        {/* Persona selector */}
        <div className="flex justify-center gap-3 mb-6">
          {(["hype", "coach", "roast"] as const).map((id) => (
            <button
              key={id}
              onClick={() => state === "idle" && setActivePersonaId(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activePersonaId === id
                  ? "bg-primary text-primary-foreground glow-blurple"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.demo.personas[id]}
            </button>
          ))}
        </div>

        {/* Falcon Voice switcher */}
        <div className="flex justify-center mb-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="sm" className="gap-2 font-mono text-xs" disabled={state !== "idle" || loadingVoices}>
                <Volume2 className="w-3.5 h-3.5" />
                {loadingVoices ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t.demo.loadingVoices}
                  </span>
                ) : selectedFalconVoice ? (
                  `${selectedFalconVoice.display_name} (${selectedFalconVoice.locale})`
                ) : (
                  t.demo.selectVoice
                )}
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 overflow-y-auto w-72">
              <DropdownMenuLabel className="font-mono text-xs">{t.demo.voiceLabel}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {falconVoices.map((voice, i) => (
                <DropdownMenuItem
                  key={`${voice.voice_id}-${i}`}
                  onClick={() => setSelectedFalconVoice(voice)}
                  className={`text-xs font-mono cursor-pointer ${selectedFalconVoice?.voice_id === voice.voice_id ? "bg-primary/10 text-primary" : ""}`}
                >
                  <span className="truncate">{voice.display_name}</span>
                  <span className="ml-auto flex items-center gap-1.5 shrink-0">
                    <span className="text-muted-foreground text-[10px]">{voice.gender}</span>
                    <span className="text-muted-foreground text-[10px]">{voice.locale}</span>
                  </span>
                </DropdownMenuItem>
              ))}
              {!loadingVoices && falconVoices.length === 0 && (
                <p className="text-xs text-muted-foreground p-2 text-center">{t.demo.noVoices}</p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main demo area */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
            {/* Ambient glow when active */}
            <AnimatePresence>
              {state !== "idle" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-primary/5 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Mic button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={state === "listening" ? stopListening : startListening}
                disabled={state === "processing" || state === "speaking" || !selectedFalconVoice}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                  state === "listening"
                    ? "bg-destructive text-destructive-foreground animate-pulse-glow"
                    : state === "processing"
                    ? "bg-secondary text-muted-foreground"
                    : state === "speaking"
                    ? "bg-accent text-accent-foreground glow-neon"
                    : "bg-primary text-primary-foreground glow-blurple hover:scale-105"
                } ${!selectedFalconVoice ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {state === "listening" ? (
                  <MicOff className="w-8 h-8" />
                ) : state === "processing" ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : state === "speaking" ? (
                  <Volume2 className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}

                {/* Ripple effect when listening */}
                {state === "listening" && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-destructive/30 animate-ping" />
                    <span className="absolute -inset-2 rounded-full border-2 border-destructive/20 animate-ping" style={{ animationDelay: "0.3s" }} />
                  </>
                )}
              </button>
            </div>

            {/* Status text */}
            <p className="text-center text-sm text-muted-foreground mb-6 font-mono">
              {state === "idle" && (selectedFalconVoice ? t.demo.clickMic : t.demo.loadingFalcon)}
              {state === "listening" && t.demo.listening}
              {state === "processing" && t.demo.processing}
              {state === "speaking" && t.demo.speaking}
            </p>

            {/* Waveform */}
            {(state === "listening" || state === "speaking") && (
              <div className="flex justify-center gap-1 mb-6">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full animate-waveform ${
                      state === "listening" ? "bg-destructive/60" : "bg-accent/60"
                    }`}
                    style={{
                      animationDelay: `${i * 0.05}s`,
                      animationDuration: `${0.5 + Math.random() * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Transcript */}
            <AnimatePresence mode="wait">
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-secondary/50 rounded-lg p-4 mb-4"
                >
                  <p className="text-xs text-muted-foreground mb-1 font-mono">{t.demo.youSaid}</p>
                  <p className="text-sm">{transcript}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Response */}
            <AnimatePresence mode="wait">
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/10 rounded-lg p-4 border border-primary/20"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <p className="text-xs text-primary font-mono font-medium">
                      HypeBot ({t.demo.personas[activePersonaId as keyof typeof t.demo.personas]}) · {selectedFalconVoice?.display_name}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed">{response}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive text-center mt-4">{error}</p>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VoiceDemo;
