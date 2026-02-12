import { Language, LocalizedString } from '@/types';

/**
 * Safely resolves a localized string (or plain string) into the requested language.
 * Falls back to English, then Arabic, and finally an empty string if nothing is available.
 */
export const getLocalizedValue = (
    value: string | LocalizedString | null | undefined,
    lang: Language = 'en'
): string => {
    if (!value) {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    return value[lang] || value.en || value.ar || '';
};

/**
 * Returns a lowercase variant suitable for comparisons/search while
 * still honouring localized inputs.
 */
export const getLocalizedValueLower = (
    value: string | LocalizedString | null | undefined,
    lang: Language = 'en'
): string => {
    return getLocalizedValue(value, lang).toLowerCase();
};
