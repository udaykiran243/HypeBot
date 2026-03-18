import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Translations, Language } from "./types";
import { languages } from "./languages";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { de } from "./locales/de";
import { pt } from "./locales/pt";
import { zh } from "./locales/zh";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { ar } from "./locales/ar";
import { hi } from "./locales/hi";
import {
  it, nl, ru, pl, uk, cs, sv, da, fi, no, tr, el, ro, hu,
  bn, th, vi, id, ms, tl, he, fa, ur, sw, bg, hr, sk, lt, lv, et, ca,
} from "./locales/others";
import { te } from "./locales/te";

const translationMap: Record<string, Translations> = {
  en, es, fr, de, pt, zh, ja, ko, ar, hi,
  it, nl, ru, pl, uk, cs, sv, da, fi, no, tr, el, ro, hu,
  bn, th, vi, id, ms, tl, he, fa, ur, sw, bg, hr, sk, lt, lv, et, ca, te,
};

interface I18nContextType {
  t: Translations;
  language: Language;
  setLanguage: (code: string) => void;
  languages: Language[];
}

const defaultLanguage = languages[0];
const defaultContext: I18nContextType = {
  t: en,
  language: defaultLanguage,
  setLanguage: () => {},
  languages,
};

const I18nContext = createContext<I18nContextType>(defaultContext);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [langCode, setLangCode] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lang");
      if (stored && translationMap[stored]) return stored;
    }
    return "en";
  });

  const language = languages.find((l) => l.code === langCode) || languages[0];
  const t = translationMap[langCode] || en;

  const setLanguage = useCallback((code: string) => {
    setLangCode(code);
    localStorage.setItem("lang", code);
    const lang = languages.find((l) => l.code === code);
    document.documentElement.dir = lang?.dir || "ltr";
  }, []);

  return (
    <I18nContext.Provider value={{ t, language, setLanguage, languages }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  return useContext(I18nContext);
};
