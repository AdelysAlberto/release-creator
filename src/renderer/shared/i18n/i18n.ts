import esDict from './locales/es.json';

export type TranslationKey = keyof typeof esDict;

export const t = (key: TranslationKey): string => {
  return esDict[key] || key;
};
