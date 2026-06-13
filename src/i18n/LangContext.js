import React, { createContext, useState, useContext, useEffect } from 'react';

const LangContext = createContext();

// Pre-load translations to avoid require issues
import { translations as allTranslations } from './translations';

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app-lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
  }, [lang]);

  // Get current translations
  const t = allTranslations[lang] || allTranslations.en;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within LangProvider');
  }
  return context;
}