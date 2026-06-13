import { useLang } from './LangContext';

export function useTranslation() {
  const { t, lang } = useLang();
  return { t, lang };
}