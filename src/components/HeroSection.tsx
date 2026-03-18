import { motion } from "framer-motion";
import { Bot, Zap, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const HeroSection = () => {
  const { t } = useI18n();

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/8 rounded-full blur-[100px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container relative z-10 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm text-muted-foreground mb-8"
          >
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span>{t.hero.badge}</span>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold font-display leading-[0.95] tracking-tight mb-6"
          >
            {t.hero.titleLine1}
            <br />
            <span className="text-gradient-blurple">{t.hero.titleLine2}</span>
            <br />
            {t.hero.titleLine3}
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant="hero" size="lg" onClick={scrollToDemo} className="text-base px-8 py-6">
              <Volume2 className="w-5 h-5 mr-2" />
              {t.hero.ctaTryDemo}
            </Button>
            <Button variant="glass" size="lg" className="text-base px-8 py-6">
              <Bot className="w-5 h-5 mr-2" />
              {t.hero.ctaAddDiscord}
            </Button>
          </motion.div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-16 relative"
          >
            <div className="glass-card rounded-2xl p-6 max-w-lg mx-auto glow-blurple animate-float">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">{t.hero.botName}</p>
                  <p className="text-xs text-accent">{t.hero.botStatus}</p>
                </div>
                <div className="ml-auto flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-waveform"
                      style={{ animationDelay: `${i * 0.15}s`, height: "16px" }}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-secondary/60 rounded-lg p-3 font-mono text-sm text-muted-foreground">
                <span className="text-accent">&gt;</span> {t.hero.botQuote}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
