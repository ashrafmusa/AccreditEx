const AI_DAILY_BRIEFING_KEY_PREFIX = "accreditex.dashboard.aiDailyBriefing.visible";

const getKey = (userId: string) => `${AI_DAILY_BRIEFING_KEY_PREFIX}.${userId}`;

export const getAIDailyBriefingVisibility = (userId?: string): boolean => {
    if (!userId) return true;

    try {
        const stored = window.localStorage.getItem(getKey(userId));
        if (stored === null) return true;
        return stored === "true";
    } catch {
        return true;
    }
};

export const setAIDailyBriefingVisibility = (
    userId: string,
    visible: boolean,
): void => {
    try {
        window.localStorage.setItem(getKey(userId), String(visible));
    } catch {
        // Silently ignore storage failures to keep dashboard functional.
    }
};
