/**
 * Test Suite for AI Agent Service - AccreditEx
 * 
 * Comprehensive tests for the AI agent service covering:
 * - Basic chat functionality
 * - Specialized compliance, risk, and training endpoints
 * - Dedicated workflow endpoints (action plan, RCA, PDCA, survey risk, design compliance)
 * - Error handling and fallback behavior
 * - Authentication and context management
 */

import { AIAgentService, ChatResponse } from '../aiAgentService';

// Mock fetch globally
global.fetch = jest.fn();

describe('AIAgentService', () => {
    let service: AIAgentService;

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockReset();
        service = new AIAgentService();
    });

    // ─────────────────────────────────────────────────────────────
    // Tests: Initialization
    // ─────────────────────────────────────────────────────────────

    describe('Initialization', () => {
        it('should initialize service without errors', () => {
            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(AIAgentService);
        });

        it('should have all public methods defined', () => {
            expect(typeof service.chat).toBe('function');
            expect(typeof service.checkCompliance).toBe('function');
            expect(typeof service.assessRisk).toBe('function');
            expect(typeof service.getTrainingRecommendations).toBe('function');
            expect(typeof service.generateActionPlan).toBe('function');
            expect(typeof service.analyzeRootCause).toBe('function');
            expect(typeof service.suggestPDCAImprovements).toBe('function');
        });
    });

    // ─────────────────────────────────────────────────────────────
    // Tests: Health Check
    // ─────────────────────────────────────────────────────────────

    describe('Health Check', () => {
        it('should return true when service is healthy', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status: 'healthy',
                    agent_initialized: true,
                    version: '2.0.0'
                })
            });

            const result = await service.healthCheck();
            expect(result).toBe(true);
        });

        it('should return false when service is unhealthy', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 503
            });

            const result = await service.healthCheck();
            expect(result).toBe(false);
        });

        it('should handle network errors gracefully', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const result = await service.healthCheck();
            expect(result).toBe(false);
        });
    });

    // ─────────────────────────────────────────────────────────────
    // Tests: Chat Endpoint
    // ─────────────────────────────────────────────────────────────

    describe('Chat', () => {
        const mockChatResponse: ChatResponse = {
            response: 'This is a test response from AI',
            thread_id: 'thread-123',
            timestamp: new Date().toISOString(),
            tools_used: []
        };

        it('should send a chat message and receive response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => mockChatResponse
            });

            const result = await service.chat('Hello AI', false);

            expect(result).toEqual(mockChatResponse);
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/chat'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('should handle plain text streaming response', async () => {
            const plainTextResponse = 'Streaming response text';
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'text/plain' }),
                text: async () => plainTextResponse
            });

            const result = await service.chat('Hello', false);

            expect(result.response).toBe(plainTextResponse);
            expect(result.timestamp).toBeDefined();
        });

        it('should include context when requested', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => mockChatResponse
            });

            await service.chat('Test message', true);

            const callArgs = (global.fetch as jest.Mock).mock.calls[0];
            const requestBody = JSON.parse(callArgs[1].body);
            expect(requestBody.context).toBeDefined();
        });

        it('should retry on network failure', async () => {
            (global.fetch as jest.Mock)
                .mockRejectedValueOnce(new TypeError('Failed to fetch'))
                .mockResolvedValueOnce({
                    ok: true,
                    headers: new Headers({ 'content-type': 'application/json' }),
                    json: async () => mockChatResponse
                });

            const result = await service.chat('Test', false);

            expect(result).toEqual(mockChatResponse);
            expect(global.fetch).toHaveBeenCalledTimes(2); // Failed attempt + retry
        });

        it('should throw error after max retries', async () => {
            (global.fetch as jest.Mock)
                .mockRejectedValueOnce(new TypeError('Failed to fetch'))
                .mockRejectedValueOnce(new TypeError('Failed to fetch'))
                .mockRejectedValueOnce(new TypeError('Failed to fetch'));

            await expect(service.chat('Test', false)).rejects.toThrow();
        });
    });

    // ─────────────────────────────────────────────────────────────
    // Tests: Specialized Endpoints
    // ─────────────────────────────────────────────────────────────

    describe('Compliance Checking', () => {
        it('should check document compliance', async () => {
            const mockResponse = {
                status: 'completed',
                analysis: 'Document is 80% compliant with CBAHI requirements',
                timestamp: new Date().toISOString()
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await service.checkCompliance({
                document_type: 'Policy',
                standard: 'CBAHI-4.1',
                content_summary: 'Quality Management Policy'
            });

            expect(result.status).toBe('completed');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/check-compliance'),
                expect.objectContaining({ method: 'POST' })
            );
        });

        it('should handle compliance check errors', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ detail: 'Compliance check failed' })
            });

            await expect(service.checkCompliance({
                document_type: 'Policy',
                standard: 'CBAHI',
                content_summary: 'Test'
            })).rejects.toThrow();
        });
    });

    describe('Risk Assessment', () => {
        it('should assess compliance risk', async () => {
            const mockResponse = {
                risk_level: 'High',
                assessment: 'Multiple gaps identified',
                timestamp: new Date().toISOString()
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await service.assessRisk({
                area: 'Quality Management',
                current_status: 'Partial implementation',
                upcoming_review_date: '2026-06-01'
            });

            expect(result.risk_level).toBe('High');
        });
    });

    describe('Training Recommendations', () => {
        it('should get training recommendations', async () => {
            const mockResponse = {
                recommendations: 'Recommend three training modules...',
                timestamp: new Date().toISOString()
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await service.getTrainingRecommendations({
                role: 'Quality Manager',
                department: 'Quality'
            });

            expect(result.recommendations).toBeDefined();
        });
    });

    // ─────────────────────────────────────────────────────────────
    // Tests: Dedicated Workflow Endpoints
    // ─────────────────────────────────────────────────────────────

    describe('Action Plan Generation', () => {
        it('should generate action plan via dedicated endpoint', async () => {
            const mockResponse = {
                status: 'completed',
                action_plan: 'Detailed action plan with 5 steps...',
                timestamp: new Date().toISOString()
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await service.generateActionPlanDedicated({
                standardId: 'CBAHI-4.1',
                item: 'Quality records management',
                status: 'Non-compliant'
            });

            expect(result.action_plan).toBeDefined();
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/generate-action-plan'),
                expect.any(Object)
            );
        });

        it('should fallback to chat on endpoint failure', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503
                });

            const result = await service.generateActionPlanDedicated({
                standardId: 'CBAHI-4.1',
                item: 'Quality records',
                status: 'Non-compliant'
            });

            expect(result).toBeDefined();
        });
    });

    describe('Root Cause Analysis', () => {
        it('should analyze root cause via dedicated endpoint', async () => {
            const mockResponse = {
                status: 'completed',
                root_cause_analysis: 'RCA findings using 5 Whys methodology...',
                timestamp: new Date().toISOString()
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await service.analyzeRootCauseDedicated({
                title: 'Incident Report Missing',
                description: 'An incident occurred but report was not completed',
                category: 'Documentation'
            });

            expect(result.root_cause_analysis).toBeDefined();
        });

        it('should fallback to chat on failure', async () => {
            (global.fetch as jest.Mock)
                .mockRejectedValueOnce(new Error('Network error'));

            const result = await service.analyzeRootCauseDedicated({
                title: 'Incident',
                description: 'Test incident'
            });

            expect(result).toBeDefined();
        });
    });

    describe('PDCA Improvements', () => {
        it('should suggest PDCA improvements via dedicated endpoint', async () => {
            const mockResponse = {
                status: 'completed',
                pdca_improvements: 'PDCA cycle suggestions...',
                timestamp: new Date().toISOString()
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await service.suggestPDCAImprovementsDedicated({
                title: 'Quality Improvement',
                currentStage: 'Check',
                description: 'Reviewing effectiveness of training'
            });

            expect(result.pdca_improvements).toBeDefined();
        });
    });

    describe('Survey Risk Assessment', () => {
        it('should assess survey risk via dedicated endpoint', async () => {
            const mockResponse = {
                status: 'completed',
                survey_risk_assessment: 'High-risk areas identified...',
                timestamp: new Date().toISOString()
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await service.assessSurveyRiskDedicated({
                standard: 'CBAHI',
                organizationArea: 'Quality Management',
                readinessLevel: 'Medium'
            });

            expect(result.survey_risk_assessment).toBeDefined();
        });

        it('should fallback to chat with formatted response', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503
                });

            const result = await service.assessSurveyRiskDedicated({
                standard: 'CBAHI',
                organizationArea: 'Quality',
                readinessLevel: 'Low'
            });

            expect(result.survey_risk_assessment).toBeDefined();
            expect(result.timestamp).toBeDefined();
        });
    });

    describe('Design Compliance Check', () => {
        it('should check design compliance via dedicated endpoint', async () => {
            const mockResponse = {
                status: 'completed',
                design_compliance_assessment: 'Design is compliant with ISO 9001...',
                timestamp: new Date().toISOString()
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse
            });

            const result = await service.checkDesignComplianceDedicated({
                standard: 'ISO 9001',
                phase: 'Validation',
                description: 'Quality management system design'
            });

            expect(result.design_compliance_assessment).toBeDefined();
        });

        it('should fallback to local method with formatted response', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: false,
                    status: 503
                });

            const result = await service.checkDesignComplianceDedicated({
                standard: 'ISO 9001',
                description: 'Test design'
            });

            expect(result.design_compliance_assessment).toBeDefined();
            expect(result.timestamp).toBeDefined();
        });
    });

    // ─────────────────────────────────────────────────────────────
    // Tests: Thread Management
    // ─────────────────────────────────────────────────────────────

    describe('Thread Management', () => {
        it('should manage conversation thread IDs', () => {
            expect(service.getThreadId()).toBeNull();
            service.resetThread();
            expect(service.getThreadId()).toBeNull();
        });

        it('should maintain thread continuity across messages', async () => {
            const mockResponse: ChatResponse = {
                response: 'Response',
                thread_id: 'thread-abc',
                timestamp: new Date().toISOString()
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => mockResponse
            });

            await service.chat('First message', false);
            const threadId1 = service.getThreadId();

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({ ...mockResponse, thread_id: 'thread-def' })
            });

            await service.chat('Second message', false);
            const threadId2 = service.getThreadId();

            expect(threadId2).toBe('thread-def'); // Updated to latest
        });
    });

    // ─────────────────────────────────────────────────────────────
    // Tests: Error Handling
    // ─────────────────────────────────────────────────────────────

    describe('Error Handling', () => {
        it('should handle timeout errors', async () => {
            (global.fetch as jest.Mock)
                .mockRejectedValueOnce(new Error('AbortError'))
                .mockRejectedValueOnce(new Error('AbortError'))
                .mockRejectedValueOnce(new Error('AbortError'));

            await expect(service.chat('Test', false)).rejects.toThrow();
        });

        it('should handle JSON parsing errors', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => { throw new Error('Invalid JSON'); },
                text: async () => 'Invalid response'
            });

            await expect(service.checkCompliance({
                document_type: 'Test',
                standard: 'Test',
                content_summary: 'Test'
            })).rejects.toThrow();
        });

        it('should provide meaningful error messages', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: async () => ({ detail: 'Unauthorized' })
            });

            try {
                await service.assessRisk({
                    area: 'Test',
                    current_status: 'Test',
                    upcoming_review_date: '2026-06-01'
                });
            } catch (error: any) {
                expect(error.message).toContain('Unauthorized');
            }
        });
    });

    // ─────────────────────────────────────────────────────────────
    // Tests: Integration Scenarios
    // ─────────────────────────────────────────────────────────────

    describe('Integration Scenarios', () => {
        it('should handle complete workflow: compliance check → action plan', async () => {
            // First: Check compliance
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status: 'completed',
                    analysis: 'Non-compliant',
                    timestamp: new Date().toISOString()
                })
            });

            await service.checkCompliance({
                document_type: 'Policy',
                standard: 'CBAHI',
                content_summary: 'Test'
            });

            // Second: Generate action plan
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status: 'completed',
                    action_plan: 'Steps to comply',
                    timestamp: new Date().toISOString()
                })
            });

            const result = await service.generateActionPlanDedicated({
                standardId: 'CBAHI',
                item: 'Policy requirements',
                status: 'Non-compliant'
            });

            expect(result.action_plan).toBeDefined();
        });

        it('should handle survey preparation workflow', async () => {
            // Risk assessment
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    risk_level: 'High',
                    assessment: 'High risk',
                    timestamp: new Date().toISOString()
                })
            });

            await service.assessRisk({
                area: 'Documentation',
                current_status: 'Incomplete',
                upcoming_review_date: '2026-05-15'
            });

            // Survey risk assessment
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    status: 'completed',
                    survey_risk_assessment: 'Recommendations',
                    timestamp: new Date().toISOString()
                })
            });

            const result = await service.assessSurveyRiskDedicated({
                standard: 'CBAHI',
                organizationArea: 'Quality',
                readinessLevel: 'Low'
            });

            expect(result.survey_risk_assessment).toBeDefined();
        });
    });
});
