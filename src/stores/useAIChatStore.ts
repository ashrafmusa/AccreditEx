import { create } from 'zustand';
import { aiAgentService } from '@/services/aiAgentService';
import type { AIGrounding } from '@/services/aiGroundingService';
import { useUserStore } from '@/stores/useUserStore';
import { useTenantStore } from '@/stores/useTenantStore';

let conversationRevision = 0;
const getChatScope = () => {
    const user = useUserStore.getState().currentUser;
    return JSON.stringify([user?.id, user?.email, user?.organizationId, useTenantStore.getState().organizationId]);
};

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    grounding?: AIGrounding;
}

interface AIChatState {
    messages: Message[];
    isOpen: boolean;
    isLoading: boolean;
    threadId: string | null;
    error: string | null;
    isServiceAvailable: boolean;

    // Actions
    sendMessage: (content: string, context?: Record<string, any>) => Promise<void>;
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    clearChat: () => void;
    setError: (error: string | null) => void;
    checkServiceHealth: () => Promise<void>;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
    messages: [],
    isOpen: false,
    isLoading: false,
    threadId: null,
    error: null,
    isServiceAvailable: true,

    sendMessage: async (content: string, context?: Record<string, any>) => {
        const revision = conversationRevision;
        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
        };

        set({
            messages: [...get().messages, userMessage],
            isLoading: true,
            error: null
        });

        try {
            const response = await aiAgentService.chat(
                content,
                true
            );
            if (revision !== conversationRevision) return;

            const assistantMessage: Message = {
                id: `msg-${Date.now()}-ai`,
                role: 'assistant',
                content: response.response,
                timestamp: response.timestamp,
                grounding: response.grounding,
            };

            set({
                messages: [...get().messages, assistantMessage],
                threadId: response.thread_id,
                isLoading: false,
                isServiceAvailable: true,
            });
        } catch (error) {
            if (revision !== conversationRevision) return;
            const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';

            set({
                error: errorMessage,
                isLoading: false,
                isServiceAvailable: !errorMessage.includes('authentication') && !errorMessage.includes('service error'),
            });
        }
    },

    toggleChat: () => set({ isOpen: !get().isOpen }),
    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),

    clearChat: () => {
        // In-flight replies must not restore evidence from a cleared scope.
        conversationRevision += 1;
        aiAgentService.resetThread();
        set({
            messages: [],
            threadId: null,
            error: null,
            isLoading: false,
        });
    },

    setError: (error) => set({ error }),

    checkServiceHealth: async () => {
        try {
            const isAvailable = await aiAgentService.healthCheck();
            set({ isServiceAvailable: isAvailable });
        } catch {
            set({ isServiceAvailable: false });
        }
    },
}));

let chatScope = getChatScope();
const clearOnScopeChange = () => {
    const nextScope = getChatScope();
    if (nextScope === chatScope) return;
    chatScope = nextScope;
    useAIChatStore.getState().clearChat();
};
useUserStore.subscribe(clearOnScopeChange);
useTenantStore.subscribe(clearOnScopeChange);
