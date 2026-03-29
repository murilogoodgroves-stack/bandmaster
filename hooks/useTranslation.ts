import { translations } from '../translations';

export const useTranslation = () => {
  // For now, always return Portuguese. Could be extended to support multiple languages
  const t = (key: string, defaultValue?: string): string => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    return typeof value === 'string' ? value : (defaultValue || key);
  };

  return { t };
};