import { Bot } from "lucide-react";
import { useI18n } from "@/i18n";

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/30 py-12">
      <div className="container px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">HypeBot</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {t.footer.builtWith}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
