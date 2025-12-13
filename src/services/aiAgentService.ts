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
        user_id?: string;
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
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        this.baseUrl = import.meta.env.VITE_AI_AGENT_URL ||
            import.meta.env.VITE_AI_AGENT_BASE_URL ||
            (isDevelopment ? 'http://localhost:8000' : 'https://accreditex.onrender.com');

        // Use environment variable or empty string (backend will return proper error)
        this.apiKey = import.meta.env.VITE_AI_AGENT_API_KEY || '';

        console.log('🤖 AI Agent Service initialized:', {
            baseUrl: this.baseUrl,
            hasApiKey: !!this.apiKey,
            apiKeyPrefix: this.apiKey ? (this.apiKey.substring(0, 8) + '...') : 'NOT SET - Configure VITE_AI_AGENT_API_KEY'
        });
    }    /**
     * Get current application context for AI agent
     */
    private getContext(): ChatRequest['context'] {
        const { currentUser } = useUserStore.getState();
        const { appSettings } = useAppStore.getState();

        return {
            user_id: currentUser?.id,
            page_title: document.title,
            route: window.location.pathname,
            user_role: currentUser?.role || 'Guest',
            current_data: {
                app_name: appSettings?.appName,
                user_name: currentUser?.name,
                user_email: currentUser?.email,
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
            // Silently fail - backend may not be available
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

            console.log('📤 Sending chat request:', {
                url: `${this.baseUrl}/chat`,
                messageLength: message.length,
                hasThreadId: !!this.threadId,
                hasContext: !!request.context
            });

            const response = await fetch(`${this.baseUrl}/chat`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(request),
            });

            console.log('📥 Response received:', {
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers.get('content-type')
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response body:', errorText);
                console.error('❌ Full error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: errorText
                });
                let errorMessage = 'AI Agent request failed';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.detail || errorJson.message || errorMessage;
                    console.error('❌ Parsed error:', errorJson);
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            // Check if response is streaming or regular JSON
            const contentType = response.headers.get('content-type');

            console.log('📦 Processing response type:', contentType);

            if (contentType?.includes('text/event-stream') || contentType?.includes('stream')) {
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
                                try {
                                    const jsonData = JSON.parse(data);
                                    if (jsonData.response) {
                                        fullResponse += jsonData.response;
                                    }
                                } catch {
                                    fullResponse += data;
                                }
                            }
                        }
                    }
                }

                const result: ChatResponse = {
                    response: fullResponse,
                    thread_id: this.threadId || '',
                    timestamp: new Date().toISOString(),
                };

                return result;
            } else if (contentType?.includes('text/plain')) {
                // Handle plain text response (streaming as plain text)
                const text = await response.text();
                console.log('📝 Plain text response received, length:', text.length);

                const result: ChatResponse = {
                    response: text,
                    thread_id: this.threadId || 'plain_' + Date.now(),
                    timestamp: new Date().toISOString(),
                };

                return result;
            } else {
                // Handle regular JSON response
                const result: ChatResponse = await response.json();

                // Store thread ID for conversation continuity
                if (result.thread_id) {
                    this.threadId = result.thread_id;
                }

                return result;
            }
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
     * Generate AI-powered action plan for checklist item
     */
    async generateActionPlan(context: {
        standardId: string;
        item: string;
        status: string;
        findings?: string;
    }): Promise<string> {
        try {
            const prompt = `Generate a detailed action plan for the following non-compliant checklist item:

Standard: ${context.standardId}
Item: ${context.item}
Current Status: ${context.status}
${context.findings ? `Findings: ${context.findings}` : ''}

Provide a clear, actionable plan with specific steps to achieve compliance.`;

            const response = await this.chat(prompt, true);
            return response.response;
        } catch (error) {
            console.error('Action plan generation error:', error);
            throw error;
        }
    }

    /**
     * AI-powered root cause analysis for CAPA
     */
    async analyzeRootCause(context: {
        title: string;
        description: string;
        category?: string;
        findings?: string;
    }): Promise<string> {
        try {
            const prompt = `Perform a root cause analysis for the following issue:

Title: ${context.title}
Description: ${context.description}
${context.category ? `Category: ${context.category}` : ''}
${context.findings ? `Findings: ${context.findings}` : ''}

Use the 5 Whys technique or Fishbone analysis to identify the root cause. Provide a comprehensive analysis.`;

            const response = await this.chat(prompt, true);
            return response.response;
        } catch (error) {
            console.error('Root cause analysis error:', error);
            throw error;
        }
    }

    /**
     * AI suggestions for PDCA cycle improvements
     */
    async suggestPDCAImprovements(context: {
        title: string;
        currentStage: string;
        description: string;
        actions?: string[];
    }): Promise<string> {
        try {
            const prompt = `Provide improvement suggestions for this PDCA cycle:

Title: ${context.title}
Current Stage: ${context.currentStage}
Description: ${context.description}
${context.actions ? `Current Actions: ${context.actions.join(', ')}` : ''}

Suggest specific improvements for the Plan-Do-Check-Act cycle to enhance effectiveness and ensure continuous improvement.`;

            const response = await this.chat(prompt, true);
            return response.response;
        } catch (error) {
            console.error('PDCA improvement suggestions error:', error);
            throw error;
        }
    }

    /**
     * AI risk assessment for survey findings
     */
    async assessSurveyRisk(context: {
        surveyTitle: string;
        failedItems: Array<{
            question: string;
            response: string;
            category?: string;
        }>;
    }): Promise<string> {
        try {
            const itemsList = context.failedItems
                .map((item, idx) => `${idx + 1}. ${item.question} - Response: ${item.response}`)
                .join('\n');

            const prompt = `Assess the risk level and provide recommendations for these survey findings:

Survey: ${context.surveyTitle}
Failed Items:
${itemsList}

Provide:
1. Overall risk assessment (Low/Medium/High/Critical)
2. Key concerns and their potential impact
3. Recommended mitigation strategies
4. Priority actions`;

            const response = await this.chat(prompt, true);
            return response.response;
        } catch (error) {
            console.error('Survey risk assessment error:', error);
            throw error;
        }
    }

    /**
     * AI compliance check for design controls
     */
    async checkDesignCompliance(context: {
        designTitle: string;
        standard: string;
        phase: string;
        description?: string;
        requirements?: string[];
    }): Promise<string> {
        try {
            const prompt = `Perform a compliance check for this design control:

Design: ${context.designTitle}
Standard: ${context.standard}
Current Phase: ${context.phase}
${context.description ? `Description: ${context.description}` : ''}
${context.requirements ? `Requirements: ${context.requirements.join(', ')}` : ''}

Analyze compliance with the specified standard and provide:
1. Compliance status assessment
2. Gaps or missing elements
3. Recommendations for improvement
4. Risk areas to address`;

            const response = await this.chat(prompt, true);
            return response.response;
        } catch (error) {
            console.error('Design compliance check error:', error);
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
