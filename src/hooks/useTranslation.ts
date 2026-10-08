import { useContext } from 'react';
import { LanguageContext } from '@/components/common/LanguageProvider';
import { locales } from '@/data/locales';

export const useTranslation = () => {
  const { lang } = useContext(LanguageContext);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const text = (locales[lang] as Record<string, string>)[key] || key;
    if (!params) return text;
    return Object.entries(params).reduce(
      (acc, [name, value]) => acc.split(`{${name}}`).join(String(value)),
      text,
    );
  };

  return { t, lang, dir: lang === 'ar' ? 'rtl' : 'ltr' };
};