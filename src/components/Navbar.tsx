import { motion } from "framer-motion";
import { Bot, Github, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useI18n } from "@/i18n";

const Navbar = () => {
  const { t } = useI18n();

  const scrollToDemo = () => {
    document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-blurple">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-display tracking-tight">
            HypeBot
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground font-medium">
          <a href="#features" className="hover:text-foreground transition-colors">{t.nav.features}</a>
          <a href="#demo" className="hover:text-foreground transition-colors">{t.nav.liveDemo}</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">{t.nav.howItWorks}</a>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="glass" size="sm" className="hidden sm:flex gap-2">
            <Github className="w-4 h-4" />
            {t.nav.github}
          </Button>
          <Button variant="hero" size="sm" onClick={scrollToDemo} className="gap-2">
            <Mic className="w-4 h-4" />
            {t.nav.tryDemo}
          </Button>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
