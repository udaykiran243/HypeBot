import { useState, useRef, useEffect } from "react";
import { Globe, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const LanguageSwitcher = () => {
  const { language, setLanguage, languages, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="glass"
        size="icon"
        className="h-9 w-9"
        onClick={() => { setOpen(!open); setSearch(""); }}
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-popover shadow-lg z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.languageSwitcher.search}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-transparent border border-border rounded-md outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Language list */}
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground p-3 text-center">
                {t.languageSwitcher.noResults}
              </p>
            )}
            {filtered.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors ${
                  language.code === lang.code
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="font-medium">{lang.nativeName}</span>
                <span className="text-muted-foreground ml-auto">{lang.name}</span>
                {language.code === lang.code && (
                  <Check className="h-3 w-3 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
