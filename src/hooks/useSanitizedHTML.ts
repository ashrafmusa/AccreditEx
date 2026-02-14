import { useMemo } from 'react';
import DOMPurify from 'dompurify';

/**
 * Custom hook to sanitize HTML content and prevent XSS attacks
 * @param dirtyHTML - Untrusted HTML string to sanitize
 * @param config - Optional DOMPurify configuration
 * @returns Sanitized HTML safe for rendering
 */
export const useSanitizedHTML = (
    dirtyHTML: string,
    config?: Record<string, any>
): string => {
    return useMemo(() => {
        if (!dirtyHTML) return '';

        // Default configuration: Allow most HTML but strip script tags and event handlers
        const defaultConfig: Record<string, any> = {
            ALLOWED_TAGS: [
                'a', 'b', 'i', 'em', 'strong', 'u', 'span', 'p', 'br', 'div',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
                'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'img', 'figure', 'figcaption'
            ],
            ALLOWED_ATTR: [
                'href', 'title', 'target', 'rel',
                'src', 'alt', 'width', 'height',
                'class', 'id', 'style'
            ],
            ALLOW_DATA_ATTR: false,
            ALLOW_UNKNOWN_PROTOCOLS: false,
            FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
            ...config
        };

        return DOMPurify.sanitize(dirtyHTML, defaultConfig) as string;
    }, [dirtyHTML, config]);
};
