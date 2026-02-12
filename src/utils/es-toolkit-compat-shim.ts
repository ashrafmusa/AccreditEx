/**
 * ES Toolkit Compatibility Shims
 * 
 * Recharts library expects default exports from 'es-toolkit/compat/*'
 * but es-toolkit uses named exports. These shims provide compatibility.
 * 
 * Issue: Recharts imports functions as default but es-toolkit exports as named.
 * Solution: Re-export as both default and named for compatibility.
 */

import {
    get as namedGet,
    uniqBy as namedUniqBy,
    sortBy as namedSortBy,
    isPlainObject as namedIsPlainObject,
    range as namedRange,
    last as namedLast,
    maxBy as namedMaxBy,
    minBy as namedMinBy,
    throttle as namedThrottle,
    omit as namedOmit,
} from 'es-toolkit/compat';

// Export all functions for individual imports
export const get = namedGet;
export const uniqBy = namedUniqBy;
export const sortBy = namedSortBy;
export const isPlainObject = namedIsPlainObject;
export const range = namedRange;
export const last = namedLast;
export const maxBy = namedMaxBy;
export const minBy = namedMinBy;
export const throttle = namedThrottle;
export const omit = namedOmit;

// Default export (for backward compatibility with previous shim)
export default namedGet;
