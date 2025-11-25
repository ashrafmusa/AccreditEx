
import { useContext } from 'react';
import { LanguageContext } from '@/components/common/LanguageProvider';
import { locales } from '@/data/locales';

export const useTranslation = () => {
  const { lang } = useContext(LanguageContext);

  const t = (key: keyof typeof locales.en) => {
    return locales[lang][key] || key;
  };

  return { t, lang, dir: lang === 'ar' ? 'rtl' : 'ltr' };
};