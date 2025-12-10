/**
 * AI Agent Service - AccreditEx
 * 
 * Service for interacting with the Python FastAPI AI agent backend.
 * Handles authentication, context injection, and error handling.
 * 
 * @author AccreditEx Team
 * @version 1.0.0
 */

import { useUserStore } from '@/stores/useUserStore';
import { useAppStore } from '@/stores/useAppStore';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface ChatRequest {
    message: string;
    thread_id?: string;
    context?: {
        page_title?: string;
        route?: string;
        user_role?: string;
        current_data?: any;
    };
}

export interface ChatResponse {
    response: string;
    thread_id: string;
    timestamp: string;
    tools_used?: string[];
}

export interface ComplianceCheckRequest {
    document_type: string;
    standard: string;
    content_summary?: string;
    requirements?: string[];
}

export interface RiskAssessmentRequest {
    area: string;
    current_status: string;
    upcoming_review_date: string;
    critical_areas?: string[];
}

export interface TrainingRecommendationsRequest {
    role: string;
    department: string;
    competency_gaps?: string[];
    upcoming_accreditation?: string;
}

export class AIAgentService {
    private baseUrl: string;
    private apiKey: string;
    private threadId: string | null = null;

    constructor() {
        // Configure based on environment
        this.baseUrl = import.meta.env.VITE_AI_AGENT_URL ||
            import.meta.env.VITE_AI_AGENT_BASE_URL ||
            'http://localhost:8000';

        this.apiKey = import.meta.env.VITE_AI_AGENT_API_KEY ||
            'dev-key-change-in-production';
    }

    /**
     * Get current application context for AI agent
     */
    private getContext(): ChatRequest['context'] {
        const { currentUser } = useUserStore.getState();
        const { appSettings } = useAppStore.getState();

        return {
            page_title: document.title,
            route: window.location.pathname,
            user_role: currentUser?.role || 'Guest',
            current_data: {
                app_name: appSettings?.appName,
                // Add more context as needed
            }
        };
    }

    /**
     * Get common headers for API requests
     */
    private getHeaders(): HeadersInit {
        return {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
        };
    }

    /**
     * Check if AI agent is healthy
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
            });

            if (!response.ok) return false;

            const data = await response.json();
            return data.status === 'healthy' && data.agent_initialized;
        } catch (error) {
            console.error('AI Agent health check failed:', error);
            return false;
        }
    }

    /**
     * Chat with AI agent
     */
    async chat(message: string, includeContext: boolean = true): Promise<ChatResponse> {
        try {
            const request: ChatRequest = {
                message,
                thread_id: this.threadId || undefined,
                context: includeContext ? this.getContext() : undefined,
            };

            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'AI Agent request failed');
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') break;
                            fullResponse += data;
                        }
                    }
                }
            }

            const result: ChatResponse = JSON.parse(fullResponse);

            // Store thread ID for conversation continuity
            this.threadId = result.thread_id;

            return result;
        } catch (error) {
            console.error('AI Agent chat error:', error);
            throw error;
        }
    }

    /**
     * Check document compliance
     */
    async checkCompliance(request: ComplianceCheckRequest): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/check-compliance`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Compliance check failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Compliance check error:', error);
            throw error;
        }
    }

    /**
     * Assess risk
     */
    async assessRisk(request: RiskAssessmentRequest): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/assess-risk`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Risk assessment failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Risk assessment error:', error);
            throw error;
        }
    }

    /**
     * Get training recommendations
     */
    async getTrainingRecommendations(request: TrainingRecommendationsRequest): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/training-recommendations`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Training recommendations failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Training recommendations error:', error);
            throw error;
        }
    }

    /**
     * Reset conversation thread
     */
    resetThread(): void {
        this.threadId = null;
    }

    /**
     * Get current thread ID
     */
    getThreadId(): string | null {
        return this.threadId;
    }
}

// Export singleton instance
export const aiAgentService = new AIAgentService();
