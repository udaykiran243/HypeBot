import { motion } from "framer-motion";
import { useI18n } from "@/i18n";

const HowItWorks = () => {
  const { t } = useI18n();
  const steps = t.howItWorks.steps;

  return (
    <section id="how-it-works" className="py-32 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-mono text-accent mb-3 tracking-wider uppercase">{t.howItWorks.label}</p>
          <h2 className="text-4xl sm:text-5xl font-bold font-display mb-4">
            {t.howItWorks.title}<span className="text-gradient-neon">{t.howItWorks.titleHighlight}</span>
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="flex gap-6 relative"
            >
              {i < steps.length - 1 && (
                <div className="absolute left-5 top-12 w-px h-full bg-border" />
              )}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/15 text-primary font-mono font-bold text-sm flex items-center justify-center z-10">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="pb-12">
                <h3 className="font-semibold font-display text-xl mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
