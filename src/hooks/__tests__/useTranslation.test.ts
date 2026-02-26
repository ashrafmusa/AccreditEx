/**
 * useTranslation hook — Unit Tests
 *
 * Tests translation lookup, fallback behavior, and direction.
 */
import { renderHook } from '@testing-library/react';
import React from 'react';
import type { Language, Direction } from '@/types';

/* ── Mock locales with known keys ────────────────────────── */
jest.mock('@/data/locales', () => ({
    locales: {
        en: { hello: 'Hello', goodbye: 'Goodbye' },
        ar: { hello: 'مرحبا', goodbye: 'مع السلامة' },
    },
}));

/* ── Controllable language context ───────────────────────── */
let ctxLang: Language = 'en';

jest.mock('@/components/common/LanguageProvider', () => {
    const React = require('react');

    const LanguageContext = React.createContext({ lang: 'en' as Language, dir: 'ltr' as Direction, toggleLang: () => { } });

    // Override useContext to return controlled value
    const originalModule = jest.requireActual('@/components/common/LanguageProvider');
    return {
        ...originalModule,
        LanguageContext,
    };
});

// We need a wrapper that provides the context
const createWrapper = (lang: Language) => {
    const { LanguageContext } = require('@/components/common/LanguageProvider');
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(LanguageContext.Provider, {
            value: { lang, dir: lang === 'ar' ? 'rtl' : 'ltr', toggleLang: () => { } },
            children,
        });
};

import { useTranslation } from '@/hooks/useTranslation';

describe('useTranslation', () => {
    describe('English context', () => {
        it('returns t function, lang, and dir', () => {
            const { result } = renderHook(() => useTranslation(), {
                wrapper: createWrapper('en'),
            });
            expect(typeof result.current.t).toBe('function');
            expect(result.current.lang).toBe('en');
            expect(result.current.dir).toBe('ltr');
        });

        it('t() translates known key', () => {
            const { result } = renderHook(() => useTranslation(), {
                wrapper: createWrapper('en'),
            });
            expect(result.current.t('hello')).toBe('Hello');
        });

        it('t() returns the key itself as fallback for missing keys', () => {
            const { result } = renderHook(() => useTranslation(), {
                wrapper: createWrapper('en'),
            });
            expect(result.current.t('nonExistentKey')).toBe('nonExistentKey');
        });
    });

    describe('Arabic context', () => {
        it('returns rtl direction', () => {
            const { result } = renderHook(() => useTranslation(), {
                wrapper: createWrapper('ar'),
            });
            expect(result.current.lang).toBe('ar');
            expect(result.current.dir).toBe('rtl');
        });

        it('t() translates known key in Arabic', () => {
            const { result } = renderHook(() => useTranslation(), {
                wrapper: createWrapper('ar'),
            });
            expect(result.current.t('hello')).toBe('مرحبا');
        });
    });
});
