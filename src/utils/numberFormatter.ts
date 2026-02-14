/**
 * Number Formatting Utilities
 * 
 * Provides locale-aware number formatting using the Intl API.
 * Supports both English (en) and Arabic (ar) locales with proper number systems.
 * 
 * @module utils/numberFormatter
 */

export type SupportedLocale = 'en' | 'ar';

/**
 * Format a number according to the specified locale
 * 
 * @param value - Number to format
 * @param locale - Locale to use for formatting ('en' or 'ar')
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234.56, 'en') // "1,234.56"
 * formatNumber(1234.56, 'ar') // "١٬٢٣٤٫٥٦"
 */
export function formatNumber(
    value: number,
    locale: SupportedLocale = 'en',
    options?: Intl.NumberFormatOptions
): string {
    return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a number with a specific number of decimal places
 * 
 * @param value - Number to format
 * @param locale - Locale to use for formatting
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 * 
 * @example
 * formatDecimal(1234.5678, 'en', 2) // "1,234.57"
 * formatDecimal(1234.5678, 'ar', 2) // "١٬٢٣٤٫٥٧"
 */
export function formatDecimal(
    value: number,
    locale: SupportedLocale = 'en',
    decimals: number = 2
): string {
    return formatNumber(value, locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Format a percentage value
 * 
 * @param value - Decimal value to format as percentage (e.g., 0.75 for 75%)
 * @param locale - Locale to use for formatting
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercent(0.7556, 'en') // "76%"
 * formatPercent(0.7556, 'en', 2) // "75.56%"
 * formatPercent(0.7556, 'ar') // "٪٧٦"
 */
export function formatPercent(
    value: number,
    locale: SupportedLocale = 'en',
    decimals: number = 0
): string {
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format a currency value
 * 
 * @param value - Amount to format
 * @param locale - Locale to use for formatting
 * @param currency - ISO 4217 currency code (default: 'USD' for 'en', 'SAR' for 'ar')
 * @param showSymbol - Whether to show currency symbol (default: true)
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56, 'en') // "$1,234.56"
 * formatCurrency(1234.56, 'ar', 'SAR') // "١٬٢٣٤٫٥٦ ر.س."
 * formatCurrency(1234.56, 'en', 'EUR') // "€1,234.56"
 */
export function formatCurrency(
    value: number,
    locale: SupportedLocale = 'en',
    currency?: string,
    showSymbol: boolean = true
): string {
    const defaultCurrency = locale === 'en' ? 'USD' : 'SAR';
    const currencyCode = currency || defaultCurrency;

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: showSymbol ? 'symbol' : 'code',
    }).format(value);
}

/**
 * Format a number in compact notation (e.g., 1.2K, 1.5M)
 * 
 * @param value - Number to format
 * @param locale - Locale to use for formatting
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted compact number string
 * 
 * @example
 * formatCompact(1234, 'en') // "1.2K"
 * formatCompact(1234567, 'en') // "1.2M"
 * formatCompact(1234, 'ar') // "١٫٢ ألف"
 */
export function formatCompact(
    value: number,
    locale: SupportedLocale = 'en',
    decimals: number = 1
): string {
    return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format a file size in bytes to human-readable format
 * 
 * @param bytes - File size in bytes
 * @param locale - Locale to use for formatting
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string
 * 
 * @example
 * formatFileSize(1024, 'en') // "1.00 KB"
 * formatFileSize(1048576, 'en') // "1.00 MB"
 * formatFileSize(1024, 'ar') // "١٫٠٠ كيلوبايت"
 */
export function formatFileSize(
    bytes: number,
    locale: SupportedLocale = 'en',
    decimals: number = 2
): string {
    if (bytes === 0) return locale === 'en' ? '0 Bytes' : '٠ بايت';

    const units = locale === 'en'
        ? ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
        : ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت', 'بيتابايت'];

    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${formatDecimal(value, locale, decimals)} ${units[i]}`;
}

/**
 * Format an ordinal number (1st, 2nd, 3rd, etc.)
 * 
 * @param value - Number to format as ordinal
 * @param locale - Locale to use for formatting
 * @returns Formatted ordinal string
 * 
 * @example
 * formatOrdinal(1, 'en') // "1st"
 * formatOrdinal(2, 'en') // "2nd"
 * formatOrdinal(1, 'ar') // "الأول"
 */
export function formatOrdinal(
    value: number,
    locale: SupportedLocale = 'en'
): string {
    // For Arabic, return the number with "ال" prefix (simplified)
    if (locale === 'ar') {
        const arabicNumerals: Record<number, string> = {
            1: 'الأول',
            2: 'الثاني',
            3: 'الثالث',
            4: 'الرابع',
            5: 'الخامس',
            6: 'السادس',
            7: 'السابع',
            8: 'الثامن',
            9: 'التاسع',
            10: 'العاشر',
        };

        return arabicNumerals[value] || `${formatNumber(value, locale)}`;
    }

    // English ordinals
    const pr = new Intl.PluralRules('en-US', { type: 'ordinal' });
    const suffixes: Record<string, string> = {
        one: 'st',
        two: 'nd',
        few: 'rd',
        other: 'th',
    };

    const rule = pr.select(value);
    const suffix = suffixes[rule];

    return `${value}${suffix}`;
}

/**
 * Format a range of numbers
 * 
 * @param start - Start of the range
 * @param end - End of the range
 * @param locale - Locale to use for formatting
 * @returns Formatted number range string
 * 
 * @example
 * formatNumberRange(1, 100, 'en') // "1–100"
 * formatNumberRange(1000, 5000, 'ar') // "١٬٠٠٠–٥٬٠٠٠"
 */
export function formatNumberRange(
    start: number,
    end: number,
    locale: SupportedLocale = 'en'
): string {
    const formatter = new Intl.NumberFormat(locale);
    return (formatter as any).formatRange(start, end);
}

/**
 * Format a number with units
 * 
 * @param value - Number to format
 * @param unit - Unit to append (e.g., 'kg', 'cm', 'hours')
 * @param locale - Locale to use for formatting
 * @returns Formatted number with unit
 * 
 * @example
 * formatWithUnit(5.5, 'kg', 'en') // "5.5 kg"
 * formatWithUnit(180, 'cm', 'ar') // "١٨٠ سم"
 */
export function formatWithUnit(
    value: number,
    unit: string,
    locale: SupportedLocale = 'en'
): string {
    const formattedNumber = formatNumber(value, locale);
    return `${formattedNumber} ${unit}`;
}

/**
 * Parse a localized number string to a JavaScript number
 * 
 * @param value - Localized number string to parse
 * @param locale - Locale the string is formatted in
 * @returns Parsed number
 * 
 * @example
 * parseLocalizedNumber("1,234.56", 'en') // 1234.56
 * parseLocalizedNumber("١٬٢٣٤٫٥٦", 'ar') // 1234.56
 */
export function parseLocalizedNumber(
    value: string,
    locale: SupportedLocale = 'en'
): number {
    // Get the decimal and thousands separators for the locale
    const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
    const decimalSeparator = parts.find(p => p.type === 'decimal')?.value || '.';
    const groupSeparator = parts.find(p => p.type === 'group')?.value || ',';

    // Replace Arabic-Indic numerals with Western Arabic numerals
    let normalized = value;
    if (locale === 'ar') {
        const arabicToWestern: Record<string, string> = {
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
            '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
        };
        normalized = value.replace(/[٠-٩]/g, (d) => arabicToWestern[d] || d);
    }

    // Remove group separators and replace decimal separator with '.'
    normalized = normalized
        .replace(new RegExp(`\\${groupSeparator}`, 'g'), '')
        .replace(decimalSeparator, '.');

    return parseFloat(normalized);
}

/**
 * Format a score or rating (e.g., 4.5 out of 5)
 * 
 * @param score - The score value
 * @param maxScore - The maximum possible score
 * @param locale - Locale to use for formatting
 * @returns Formatted score string
 * 
 * @example
 * formatScore(4.5, 5, 'en') // "4.5/5"
 * formatScore(85, 100, 'ar') // "٨٥/١٠٠"
 */
export function formatScore(
    score: number,
    maxScore: number,
    locale: SupportedLocale = 'en'
): string {
    const formattedScore = formatNumber(score, locale);
    const formattedMax = formatNumber(maxScore, locale);
    return `${formattedScore}/${formattedMax}`;
}

/**
 * Convert Western Arabic numerals (0-9) to Arabic-Indic numerals (٠-٩)
 * 
 * @param value - String containing Western Arabic numerals
 * @returns String with Arabic-Indic numerals
 * 
 * @example
 * toArabicNumerals("123") // "١٢٣"
 */
export function toArabicNumerals(value: string): string {
    const westernToArabic: Record<string, string> = {
        '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
        '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
    };

    return value.replace(/[0-9]/g, (d) => westernToArabic[d] || d);
}

/**
 * Convert Arabic-Indic numerals (٠-٩) to Western Arabic numerals (0-9)
 * 
 * @param value - String containing Arabic-Indic numerals
 * @returns String with Western Arabic numerals
 * 
 * @example
 * toWesternNumerals("١٢٣") // "123"
 */
export function toWesternNumerals(value: string): string {
    const arabicToWestern: Record<string, string> = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    };

    return value.replace(/[٠-٩]/g, (d) => arabicToWestern[d] || d);
}
