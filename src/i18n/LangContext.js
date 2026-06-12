import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('qp_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('qp_lang', lang);
  }, [lang]);

  const t = translations[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
