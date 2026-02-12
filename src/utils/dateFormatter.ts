/**
 * Date and Time Formatting Utilities
 * 
 * Provides locale-aware date and time formatting using the Intl API.
 * Supports both English (en) and Arabic (ar) locales.
 * 
 * @module utils/dateFormatter
 */

export type SupportedLocale = 'en' | 'ar';

/**
 * Format a date according to the specified locale
 * 
 * @param date - Date object or timestamp to format
 * @param locale - Locale to use for formatting ('en' or 'ar')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date(), 'en') // "Jan 15, 2025"
 * formatDate(new Date(), 'ar') // "١٥ يناير ٢٠٢٥"
 */
export function formatDate(
    date: Date | number,
    locale: SupportedLocale = 'en',
    options?: Intl.DateTimeFormatOptions
): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(
        typeof date === 'number' ? new Date(date) : date
    );
}

/**
 * Format a date in long format
 * 
 * @param date - Date object or timestamp to format
 * @param locale - Locale to use for formatting
 * @returns Long formatted date string
 * 
 * @example
 * formatDateLong(new Date(), 'en') // "Wednesday, January 15, 2025"
 * formatDateLong(new Date(), 'ar') // "الأربعاء، ١٥ يناير ٢٠٢٥"
 */
export function formatDateLong(
    date: Date | number,
    locale: SupportedLocale = 'en'
): string {
    return formatDate(date, locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Format time according to the specified locale
 * 
 * @param date - Date object or timestamp to format
 * @param locale - Locale to use for formatting
 * @param use24Hour - Use 24-hour format (default: true for 'ar', false for 'en')
 * @returns Formatted time string
 * 
 * @example
 * formatTime(new Date(), 'en') // "3:30 PM"
 * formatTime(new Date(), 'ar') // "١٥:٣٠"
 */
export function formatTime(
    date: Date | number,
    locale: SupportedLocale = 'en',
    use24Hour?: boolean
): string {
    const hour12 = use24Hour !== undefined ? !use24Hour : locale === 'en';

    return new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12,
    }).format(typeof date === 'number' ? new Date(date) : date);
}

/**
 * Format date and time together
 * 
 * @param date - Date object or timestamp to format
 * @param locale - Locale to use for formatting
 * @returns Formatted date and time string
 * 
 * @example
 * formatDateTime(new Date(), 'en') // "Jan 15, 2025, 3:30 PM"
 * formatDateTime(new Date(), 'ar') // "١٥ يناير ٢٠٢٥، ١٥:٣٠"
 */
export function formatDateTime(
    date: Date | number,
    locale: SupportedLocale = 'en'
): string {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    return `${formatDate(dateObj, locale)}, ${formatTime(dateObj, locale)}`;
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * 
 * @param date - Date object or timestamp to compare against current time
 * @param locale - Locale to use for formatting
 * @returns Relative time string
 * 
 * @example
 * formatRelativeTime(Date.now() - 3600000, 'en') // "1 hour ago"
 * formatRelativeTime(Date.now() + 86400000, 'en') // "in 1 day"
 * formatRelativeTime(Date.now() - 3600000, 'ar') // "قبل ساعة واحدة"
 */
export function formatRelativeTime(
    date: Date | number,
    locale: SupportedLocale = 'en'
): string {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffYear) >= 1) {
        return rtf.format(diffYear, 'year');
    } else if (Math.abs(diffMonth) >= 1) {
        return rtf.format(diffMonth, 'month');
    } else if (Math.abs(diffWeek) >= 1) {
        return rtf.format(diffWeek, 'week');
    } else if (Math.abs(diffDay) >= 1) {
        return rtf.format(diffDay, 'day');
    } else if (Math.abs(diffHour) >= 1) {
        return rtf.format(diffHour, 'hour');
    } else if (Math.abs(diffMin) >= 1) {
        return rtf.format(diffMin, 'minute');
    } else {
        return rtf.format(diffSec, 'second');
    }
}

/**
 * Format a date range
 * 
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @param locale - Locale to use for formatting
 * @returns Formatted date range string
 * 
 * @example
 * formatDateRange(new Date('2025-01-15'), new Date('2025-01-20'), 'en')
 * // "Jan 15 – 20, 2025"
 */
export function formatDateRange(
    startDate: Date | number,
    endDate: Date | number,
    locale: SupportedLocale = 'en'
): string {
    const start = typeof startDate === 'number' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'number' ? new Date(endDate) : endDate;

    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).formatRange(start, end);
}

/**
 * Get the day of the week
 * 
 * @param date - Date object or timestamp
 * @param locale - Locale to use for formatting
 * @param format - 'long' for full name, 'short' for abbreviation
 * @returns Day of the week name
 * 
 * @example
 * getDayOfWeek(new Date(), 'en', 'long') // "Wednesday"
 * getDayOfWeek(new Date(), 'ar', 'long') // "الأربعاء"
 */
export function getDayOfWeek(
    date: Date | number,
    locale: SupportedLocale = 'en',
    format: 'long' | 'short' = 'long'
): string {
    return new Intl.DateTimeFormat(locale, { weekday: format }).format(
        typeof date === 'number' ? new Date(date) : date
    );
}

/**
 * Get the month name
 * 
 * @param date - Date object or timestamp
 * @param locale - Locale to use for formatting
 * @param format - 'long' for full name, 'short' for abbreviation
 * @returns Month name
 * 
 * @example
 * getMonthName(new Date(), 'en', 'long') // "January"
 * getMonthName(new Date(), 'ar', 'long') // "يناير"
 */
export function getMonthName(
    date: Date | number,
    locale: SupportedLocale = 'en',
    format: 'long' | 'short' = 'long'
): string {
    return new Intl.DateTimeFormat(locale, { month: format }).format(
        typeof date === 'number' ? new Date(date) : date
    );
}

/**
 * Check if a date is today
 * 
 * @param date - Date object or timestamp to check
 * @returns True if the date is today
 */
export function isToday(date: Date | number): boolean {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    const today = new Date();

    return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
    );
}

/**
 * Check if a date is yesterday
 * 
 * @param date - Date object or timestamp to check
 * @returns True if the date is yesterday
 */
export function isYesterday(date: Date | number): boolean {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return (
        dateObj.getDate() === yesterday.getDate() &&
        dateObj.getMonth() === yesterday.getMonth() &&
        dateObj.getFullYear() === yesterday.getFullYear()
    );
}

/**
 * Check if a date is tomorrow
 * 
 * @param date - Date object or timestamp to check
 * @returns True if the date is tomorrow
 */
export function isTomorrow(date: Date | number): boolean {
    const dateObj = typeof date === 'number' ? new Date(date) : date;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (
        dateObj.getDate() === tomorrow.getDate() &&
        dateObj.getMonth() === tomorrow.getMonth() &&
        dateObj.getFullYear() === tomorrow.getFullYear()
    );
}

/**
 * Format a date with custom smart formatting
 * - Shows "Today" if date is today
 * - Shows "Yesterday" if date is yesterday
 * - Shows "Tomorrow" if date is tomorrow
 * - Shows relative time if within last 7 days
 * - Shows full date otherwise
 * 
 * @param date - Date object or timestamp to format
 * @param locale - Locale to use for formatting
 * @returns Smart formatted date string
 * 
 * @example
 * formatSmartDate(new Date(), 'en') // "Today"
 * formatSmartDate(Date.now() - 86400000, 'en') // "Yesterday"
 * formatSmartDate(Date.now() - 172800000, 'en') // "2 days ago"
 */
export function formatSmartDate(
    date: Date | number,
    locale: SupportedLocale = 'en'
): string {
    const dateObj = typeof date === 'number' ? new Date(date) : date;

    if (isToday(dateObj)) {
        return locale === 'en' ? 'Today' : 'اليوم';
    }

    if (isYesterday(dateObj)) {
        return locale === 'en' ? 'Yesterday' : 'أمس';
    }

    if (isTomorrow(dateObj)) {
        return locale === 'en' ? 'Tomorrow' : 'غداً';
    }

    const diffMs = Math.abs(Date.now() - dateObj.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Use relative time for dates within last 7 days
    if (diffDays < 7) {
        return formatRelativeTime(dateObj, locale);
    }

    // Otherwise use standard date format
    return formatDate(dateObj, locale);
}
