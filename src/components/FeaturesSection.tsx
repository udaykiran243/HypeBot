import { motion } from "framer-motion";
import { Mic, Zap, Sparkles, Globe2, ListOrdered, Timer } from "lucide-react";
import { useI18n } from "@/i18n";

const featureIcons = [Mic, Zap, Sparkles, Globe2, ListOrdered, Timer];
const featureAccents = ["primary", "accent", "primary", "accent", "primary", "accent"] as const;

const FeaturesSection = () => {
  const { t } = useI18n();

  return (
    <section id="features" className="py-32 relative">
      <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-transparent to-border" />
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-mono text-accent mb-3 tracking-wider uppercase">{t.features.label}</p>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            {t.features.title}<span className="text-gradient-blurple">{t.features.titleHighlight}</span> voice
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t.features.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {t.features.items.map((feature, i) => {
            const Icon = featureIcons[i];
            const accent = featureAccents[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 group hover:border-primary/30 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${accent === "primary" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold font-display text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
