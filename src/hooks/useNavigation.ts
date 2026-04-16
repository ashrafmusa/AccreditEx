/**
 * useNavigation Hook
 * 
 * Provides bidirectional sync between NavigationState and URL routing
 * Maintains backward compatibility with existing setNavigation calls
 * 
 * Features:
 * - Syncs NavigationState changes to URL
 * - Syncs URL changes to NavigationState
 * - Preserves browser back/forward functionality
 * - Works with existing setNavigation calls
 */

import { navigationStateToPath, pathToNavigationState } from '@/router/routes';
import { NavigationState } from '@/types';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

interface UseNavigationReturn {
    navigation: NavigationState;
    setNavigation: (state: NavigationState) => void;
}

export const useNavigation = (
    initialNavigation: NavigationState
): UseNavigationReturn => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const navigationRef = useRef<NavigationState>(initialNavigation);
    const isNavigatingRef = useRef(false);

    // Parse query parameters from URL
    const queryParams = new URLSearchParams(location.search);

    // Update navigation based on current URL
    const getNavigationFromUrl = useCallback((): NavigationState => {
        const navState = pathToNavigationState(location.pathname, params);
        // Add templateId from query params if present
        const templateId = new URLSearchParams(location.search).get('templateId');
        if (templateId) {
            return { ...navState, templateId };
        }
        return navState;
    }, [location.pathname, params, location.search]);

    // Initialize navigation from URL on mount
    useEffect(() => {
        const urlNavigation = getNavigationFromUrl();
        navigationRef.current = urlNavigation;
    }, []); // Empty array - only on mount

    // Sync URL changes to navigation (browser back/forward)
    useEffect(() => {
        if (isNavigatingRef.current) {
            // Skip if we triggered this navigation
            isNavigatingRef.current = false;
            return;
        }

        const urlNavigation = getNavigationFromUrl();
        navigationRef.current = urlNavigation;
    }, [location.pathname, getNavigationFromUrl]);

    // setNavigation function that updates both state and URL
    const setNavigation = useCallback(
        (state: NavigationState) => {
            // Update ref
            navigationRef.current = state;

            // Convert to path
            const path = navigationStateToPath(state);

            // Set flag to prevent circular updates
            isNavigatingRef.current = true;

            // Update URL
            navigate(path, { replace: false });

            // Reset flag after navigation
            setTimeout(() => {
                isNavigatingRef.current = false;
            }, 0);
        },
        [navigate]
    );

    return {
        navigation: getNavigationFromUrl(),
        setNavigation,
    };
};
