/**
 * Hook for lazy loading data with pagination
 * Supports incremental data fetching and cursor-based pagination
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface UseLazyLoadOptions {
  initialLoad?: boolean;
  pageSize?: number;
  onError?: (error: Error) => void;
}

export interface UseLazyLoadState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  cursor?: any;
}

export function useLazyLoad<T>(
  fetchFn: (pageSize: number, cursor?: any) => Promise<{ data: T[]; hasMore: boolean; cursor?: any }>,
  options: UseLazyLoadOptions = {}
): UseLazyLoadState<T> & { loadMore: () => Promise<void> } {
  const {
    initialLoad = true,
    pageSize = 50,
    onError
  } = options;

  const [state, setState] = useState<UseLazyLoadState<T>>({
    data: [],
    loading: initialLoad,
    error: null,
    hasMore: true,
    cursor: undefined,
  });

  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !state.hasMore) return;

    loadingRef.current = true;
    setState(prev => ({ ...prev, loading: true }));

    try {
      const result = await fetchFn(pageSize, state.cursor);
      
      setState(prev => ({
        data: [...prev.data, ...result.data],
        hasMore: result.hasMore,
        cursor: result.cursor,
        loading: false,
        error: null,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
      }));
      onError?.(err);
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFn, pageSize, state.cursor, state.hasMore, onError]);

  useEffect(() => {
    if (initialLoad && state.data.length === 0) {
      loadMore();
    }
  }, []);

  return {
    ...state,
    loadMore,
  };
}
