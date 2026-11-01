/** What a component hands to a helper that writes a sentence: the `t` of `useTranslations(namespace)`, or of `getTranslations`. */
export type Translate = (key: string, values?: Record<string, string | number>) => string;
