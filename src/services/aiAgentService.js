"use strict";
/**
 * AI Agent Service - AccreditEx
 *
 * Service for interacting with the Python FastAPI AI agent backend.
 * Handles authentication, context injection, and error handling.
 *
 * @author AccreditEx Team
 * @version 1.0.0
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiAgentService = exports.AIAgentService = void 0;
var firebaseConfig_1 = require("@/firebase/firebaseConfig");
var useAppStore_1 = require("@/stores/useAppStore");
var useUserStore_1 = require("@/stores/useUserStore");
/** Production backend URL */
var RENDER_URL = 'https://accreditex.onrender.com';
/**
 * API key – MUST be set via VITE_AI_AGENT_API_KEY env var.
 * Security (audit fix S-1): No hardcoded fallback key in source code.
 */
/** Fetch timeout in milliseconds (90 s — allows for Render cold starts) */
var FETCH_TIMEOUT_MS = 90000;
/** Maximum retry attempts for network failures */
var MAX_RETRIES = 2;
var AIAgentService = /** @class */ (function () {
    function AIAgentService() {
        this.threadId = null;
        // Detect environment at RUNTIME (not build-time) so a stale .env
        // value like "http://localhost:8000" doesn't break production.
        var isDevelopment = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';
        var envUrl = import.meta.env.VITE_AI_AGENT_URL ||
            import.meta.env.VITE_AI_AGENT_BASE_URL ||
            '';
        // In production, NEVER use a localhost URL — fall back to Render.
        var envIsLocalhost = envUrl.includes('localhost') || envUrl.includes('127.0.0.1');
        if (isDevelopment) {
            this.baseUrl = envUrl || 'http://localhost:8000';
        }
        else {
            this.baseUrl = envIsLocalhost || !envUrl ? RENDER_URL : envUrl;
        }
        // Security fix (2026-04-17 SEC-H1): API key no longer read from frontend env.
        // Auth is now handled exclusively via Firebase ID tokens (Bearer).
        // The API_KEY stays on the Render server only (never bundled into client JS).
        if (import.meta.env.DEV) {
            console.log('🤖 AI Agent Service initialized:', {
                baseUrl: this.baseUrl,
                auth: 'Firebase Bearer token',
            });
        }
    } /**
     * Get current application context for AI agent
     * Enhanced with comprehensive user and workspace data
     */
    AIAgentService.prototype.getContext = function () {
        var _a, _b;
        var _c = useUserStore_1.useUserStore.getState(), currentUser = _c.currentUser, users = _c.users;
        var appState = useAppStore_1.useAppStore.getState();
        var appSettings = appState.appSettings, departments = appState.departments, documents = appState.documents;
        var projects = appState.projects || [];
        var safeUsers = users || [];
        var safeProjects = projects || [];
        var safeDepartments = departments || [];
        var safeDocuments = documents || [];
        var authUser = (0, firebaseConfig_1.getAuthInstance)().currentUser;
        var resolvedUser = currentUser || ((authUser === null || authUser === void 0 ? void 0 : authUser.email)
            ? safeUsers.find(function (u) { return u.email === authUser.email; }) || null
            : null);
        // Get user's assigned projects
        var userProjects = safeProjects.filter(function (p) {
            var _a;
            return p.projectLeadId === (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.id) ||
                ((_a = p.teamMembers) === null || _a === void 0 ? void 0 : _a.includes(resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.id));
        });
        // Get user's department info
        var userDepartment = safeDepartments.find(function (d) {
            var _a;
            return d.id === (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.department) ||
                ((_a = d.members) === null || _a === void 0 ? void 0 : _a.some(function (m) { return m === (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.id); }));
        });
        // Get recent documents user has access to
        var userDocuments = safeDocuments
            .filter(function (doc) {
            var _a;
            return doc.uploadedBy === (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.name) ||
                ((_a = doc.departmentIds) === null || _a === void 0 ? void 0 : _a.includes((resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.department) || ''));
        })
            .slice(0, 10); // Limit to recent 10
        var resolvedRole = (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.role) || (authUser ? 'Authenticated User' : 'Guest');
        return {
            user_id: (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.id) || (authUser === null || authUser === void 0 ? void 0 : authUser.uid),
            page_title: document.title,
            route: window.location.pathname,
            user_role: resolvedRole,
            current_data: {
                // App context
                app_name: appSettings === null || appSettings === void 0 ? void 0 : appSettings.appName,
                // User info
                user_name: (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.name) || (authUser === null || authUser === void 0 ? void 0 : authUser.displayName),
                user_email: (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.email) || (authUser === null || authUser === void 0 ? void 0 : authUser.email),
                user_department: ((_a = userDepartment === null || userDepartment === void 0 ? void 0 : userDepartment.name) === null || _a === void 0 ? void 0 : _a.en) || (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.department),
                user_permissions: (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.permissions) || [],
                // User's projects summary
                assigned_projects: userProjects.map(function (p) { return ({
                    id: p.id,
                    name: p.name,
                    status: p.status,
                    progress: p.progress,
                    programId: p.programId
                }); }),
                active_projects_count: userProjects.filter(function (p) { return p.status === 'In Progress'; }).length,
                // Workspace overview
                total_projects: safeProjects.length,
                total_departments: safeDepartments.length,
                total_documents: safeDocuments.length,
                total_users: safeUsers.length,
                // Recent activity
                recent_documents: userDocuments.map(function (d) { return ({
                    name: d.name.en,
                    type: d.type,
                    status: d.status
                }); }),
                // Department context
                department_info: userDepartment ? {
                    name: userDepartment.name.en,
                    head: userDepartment.head,
                    member_count: ((_b = userDepartment.members) === null || _b === void 0 ? void 0 : _b.length) || 0
                } : null
            }
        };
    };
    /**
     * Get common headers for API requests.
     * Security fix (2026-04-17 SEC-H1): Removed X-API-Key from frontend.
     * The API key must never be bundled in client JS — it would be visible
     * in the browser's network tab and source maps.
     *
     * Auth path: Firebase ID token (Authorization: Bearer) only.
     * The Render backend validates this via firebase_admin.verify_id_token().
     */
    AIAgentService.prototype.getHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var headers, auth, user, token, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headers = {
                            'Content-Type': 'application/json',
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('@/firebase/firebaseConfig'); })];
                    case 2:
                        auth = (_a.sent()).auth;
                        user = auth.currentUser;
                        if (!user) return [3 /*break*/, 4];
                        return [4 /*yield*/, user.getIdToken()];
                    case 3:
                        token = _a.sent();
                        headers['Authorization'] = "Bearer ".concat(token);
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        console.warn('[AI Agent] Could not attach Firebase token:', e_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, headers];
                }
            });
        });
    };
    /**
     * Fetch with timeout + automatic retry (handles Render cold-start failures).
     */
    AIAgentService.prototype.fetchWithRetry = function (url_1, init_1) {
        return __awaiter(this, arguments, void 0, function (url, init, retries) {
            var lastError, _loop_1, attempt, state_1;
            var _a, _b;
            if (retries === void 0) { retries = MAX_RETRIES; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        lastError = null;
                        _loop_1 = function (attempt) {
                            var controller, timer, res, err_1, isNetworkError;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        controller = new AbortController();
                                        timer = setTimeout(function () { return controller.abort(); }, FETCH_TIMEOUT_MS);
                                        _d.label = 1;
                                    case 1:
                                        _d.trys.push([1, 3, , 5]);
                                        return [4 /*yield*/, fetch(url, __assign(__assign({}, init), { signal: controller.signal }))];
                                    case 2:
                                        res = _d.sent();
                                        clearTimeout(timer);
                                        return [2 /*return*/, { value: res }];
                                    case 3:
                                        err_1 = _d.sent();
                                        clearTimeout(timer);
                                        lastError = err_1;
                                        isNetworkError = err_1.name === 'AbortError' ||
                                            err_1.name === 'TypeError' ||
                                            ((_a = err_1.message) === null || _a === void 0 ? void 0 : _a.includes('Failed to fetch')) ||
                                            ((_b = err_1.message) === null || _b === void 0 ? void 0 : _b.includes('NetworkError'));
                                        if (!isNetworkError || attempt >= retries)
                                            return [2 /*return*/, "break"];
                                        // Wait 2s before retry (give Render time to wake up)
                                        console.warn("\u23F3 AI request attempt ".concat(attempt + 1, " failed, retrying in 2 s\u2026"));
                                        return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 2000); })];
                                    case 4:
                                        _d.sent();
                                        return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 0;
                        _c.label = 1;
                    case 1:
                        if (!(attempt <= retries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _c.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        if (state_1 === "break")
                            return [3 /*break*/, 4];
                        _c.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError !== null && lastError !== void 0 ? lastError : new Error('AI Agent request failed');
                }
            });
        });
    };
    /**
     * Check if AI agent is healthy
     */
    AIAgentService.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(this.baseUrl, "/health"), {
                                method: 'GET',
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        return [2 /*return*/, data.status === 'healthy' && data.agent_initialized];
                    case 3:
                        error_1 = _a.sent();
                        // Silently fail - backend may not be available
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Chat with AI agent
     */
    AIAgentService.prototype.chat = function (message_1) {
        return __awaiter(this, arguments, void 0, function (message, includeContext) {
            var request, response, _a, _b, errorText, errorMessage, errorJson, contentType, reader, decoder, fullResponse, _c, done, value, chunk, lines, _i, lines_1, line, data, jsonData, result, text, result, result, error_2;
            var _d;
            var _e;
            if (includeContext === void 0) { includeContext = true; }
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 13, , 14]);
                        request = {
                            message: message,
                            thread_id: this.threadId || undefined,
                            context: includeContext ? this.getContext() : undefined,
                        };
                        console.log('📤 Sending chat request:', {
                            url: "".concat(this.baseUrl, "/chat"),
                            messageLength: message.length,
                            hasThreadId: !!this.threadId,
                            hasContext: !!request.context
                        });
                        _a = this.fetchWithRetry;
                        _b = ["".concat(this.baseUrl, "/chat")];
                        _d = {
                            method: 'POST'
                        };
                        return [4 /*yield*/, this.getHeaders()];
                    case 1: return [4 /*yield*/, _a.apply(this, _b.concat([(_d.headers = _f.sent(),
                                _d.body = JSON.stringify(request),
                                _d)]))];
                    case 2:
                        response = _f.sent();
                        console.log('📥 Response received:', {
                            status: response.status,
                            statusText: response.statusText,
                            contentType: response.headers.get('content-type')
                        });
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.text()];
                    case 3:
                        errorText = _f.sent();
                        console.error('❌ Error response body:', errorText);
                        console.error('❌ Full error details:', {
                            status: response.status,
                            statusText: response.statusText,
                            headers: Object.fromEntries(response.headers.entries()),
                            body: errorText
                        });
                        errorMessage = 'AI Agent request failed';
                        try {
                            errorJson = JSON.parse(errorText);
                            errorMessage = errorJson.detail || errorJson.message || errorMessage;
                            console.error('❌ Parsed error:', errorJson);
                        }
                        catch (_g) {
                            errorMessage = errorText || errorMessage;
                        }
                        throw new Error(errorMessage);
                    case 4:
                        contentType = response.headers.get('content-type');
                        console.log('📦 Processing response type:', contentType);
                        if (!((contentType === null || contentType === void 0 ? void 0 : contentType.includes('text/event-stream')) || (contentType === null || contentType === void 0 ? void 0 : contentType.includes('stream')))) return [3 /*break*/, 8];
                        reader = (_e = response.body) === null || _e === void 0 ? void 0 : _e.getReader();
                        decoder = new TextDecoder();
                        fullResponse = '';
                        if (!reader) return [3 /*break*/, 7];
                        _f.label = 5;
                    case 5:
                        if (!true) return [3 /*break*/, 7];
                        return [4 /*yield*/, reader.read()];
                    case 6:
                        _c = _f.sent(), done = _c.done, value = _c.value;
                        if (done)
                            return [3 /*break*/, 7];
                        chunk = decoder.decode(value);
                        lines = chunk.split('\n');
                        for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                            line = lines_1[_i];
                            if (line.startsWith('data: ')) {
                                data = line.slice(6);
                                if (data === '[DONE]')
                                    break;
                                try {
                                    jsonData = JSON.parse(data);
                                    if (jsonData.response) {
                                        fullResponse += jsonData.response;
                                    }
                                }
                                catch (_h) {
                                    fullResponse += data;
                                }
                            }
                        }
                        return [3 /*break*/, 5];
                    case 7:
                        result = {
                            response: fullResponse,
                            thread_id: this.threadId || '',
                            timestamp: new Date().toISOString(),
                        };
                        return [2 /*return*/, result];
                    case 8:
                        if (!(contentType === null || contentType === void 0 ? void 0 : contentType.includes('text/plain'))) return [3 /*break*/, 10];
                        return [4 /*yield*/, response.text()];
                    case 9:
                        text = _f.sent();
                        console.log('📝 Plain text response received, length:', text.length);
                        result = {
                            response: text,
                            thread_id: this.threadId || 'plain_' + Date.now(),
                            timestamp: new Date().toISOString(),
                        };
                        return [2 /*return*/, result];
                    case 10: return [4 /*yield*/, response.json()];
                    case 11:
                        result = _f.sent();
                        // Store thread ID for conversation continuity
                        if (result.thread_id) {
                            this.threadId = result.thread_id;
                        }
                        return [2 /*return*/, result];
                    case 12: return [3 /*break*/, 14];
                    case 13:
                        error_2 = _f.sent();
                        console.error('AI Agent chat error:', error_2);
                        throw error_2;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check document compliance
     */
    AIAgentService.prototype.checkCompliance = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, _b, error, error_3;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 7]);
                        _a = fetch;
                        _b = ["".concat(this.baseUrl, "/check-compliance")];
                        _c = {
                            method: 'POST'
                        };
                        return [4 /*yield*/, this.getHeaders()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.headers = _d.sent(),
                                _c.body = JSON.stringify(request),
                                _c)]))];
                    case 2:
                        response = _d.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        error = _d.sent();
                        throw new Error(error.detail || 'Compliance check failed');
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _d.sent()];
                    case 6:
                        error_3 = _d.sent();
                        console.error('Compliance check error:', error_3);
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Assess risk
     */
    AIAgentService.prototype.assessRisk = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, _b, error, error_4;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 7]);
                        _a = fetch;
                        _b = ["".concat(this.baseUrl, "/assess-risk")];
                        _c = {
                            method: 'POST'
                        };
                        return [4 /*yield*/, this.getHeaders()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.headers = _d.sent(),
                                _c.body = JSON.stringify(request),
                                _c)]))];
                    case 2:
                        response = _d.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        error = _d.sent();
                        throw new Error(error.detail || 'Risk assessment failed');
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _d.sent()];
                    case 6:
                        error_4 = _d.sent();
                        console.error('Risk assessment error:', error_4);
                        throw error_4;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get training recommendations
     */
    AIAgentService.prototype.getTrainingRecommendations = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, _b, error, error_5;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 7]);
                        _a = fetch;
                        _b = ["".concat(this.baseUrl, "/training-recommendations")];
                        _c = {
                            method: 'POST'
                        };
                        return [4 /*yield*/, this.getHeaders()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.headers = _d.sent(),
                                _c.body = JSON.stringify(request),
                                _c)]))];
                    case 2:
                        response = _d.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        error = _d.sent();
                        throw new Error(error.detail || 'Training recommendations failed');
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _d.sent()];
                    case 6:
                        error_5 = _d.sent();
                        console.error('Training recommendations error:', error_5);
                        throw error_5;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate AI-powered action plan for checklist item
     */
    AIAgentService.prototype.generateActionPlan = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt_1, response, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        prompt_1 = "Generate a detailed action plan for the following non-compliant checklist item:\n\nStandard: ".concat(context.standardId, "\nItem: ").concat(context.item, "\nCurrent Status: ").concat(context.status, "\n").concat(context.findings ? "Findings: ".concat(context.findings) : '', "\n\nProvide a clear, actionable plan with specific steps to achieve compliance.");
                        return [4 /*yield*/, this.chat(prompt_1, true)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.response];
                    case 2:
                        error_6 = _a.sent();
                        console.error('Action plan generation error:', error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * AI-powered root cause analysis for CAPA
     */
    AIAgentService.prototype.analyzeRootCause = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt_2, response, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        prompt_2 = "Perform a root cause analysis for the following issue:\n\nTitle: ".concat(context.title, "\nDescription: ").concat(context.description, "\n").concat(context.category ? "Category: ".concat(context.category) : '', "\n").concat(context.findings ? "Findings: ".concat(context.findings) : '', "\n\nUse the 5 Whys technique or Fishbone analysis to identify the root cause. Provide a comprehensive analysis.");
                        return [4 /*yield*/, this.chat(prompt_2, true)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.response];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Root cause analysis error:', error_7);
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * AI suggestions for PDCA cycle improvements
     */
    AIAgentService.prototype.suggestPDCAImprovements = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt_3, response, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        prompt_3 = "Provide improvement suggestions for this PDCA cycle:\n\nTitle: ".concat(context.title, "\nCurrent Stage: ").concat(context.currentStage, "\nDescription: ").concat(context.description, "\n").concat(context.actions ? "Current Actions: ".concat(context.actions.join(', ')) : '', "\n\nSuggest specific improvements for the Plan-Do-Check-Act cycle to enhance effectiveness and ensure continuous improvement.");
                        return [4 /*yield*/, this.chat(prompt_3, true)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.response];
                    case 2:
                        error_8 = _a.sent();
                        console.error('PDCA improvement suggestions error:', error_8);
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * AI risk assessment for survey findings
     */
    AIAgentService.prototype.assessSurveyRisk = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var itemsList, prompt_4, response, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        itemsList = context.failedItems
                            .map(function (item, idx) { return "".concat(idx + 1, ". ").concat(item.question, " - Response: ").concat(item.response); })
                            .join('\n');
                        prompt_4 = "Assess the risk level and provide recommendations for these survey findings:\n\nSurvey: ".concat(context.surveyTitle, "\nFailed Items:\n").concat(itemsList, "\n\nProvide:\n1. Overall risk assessment (Low/Medium/High/Critical)\n2. Key concerns and their potential impact\n3. Recommended mitigation strategies\n4. Priority actions");
                        return [4 /*yield*/, this.chat(prompt_4, true)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.response];
                    case 2:
                        error_9 = _a.sent();
                        console.error('Survey risk assessment error:', error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * AI compliance check for design controls
     */
    AIAgentService.prototype.checkDesignCompliance = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt_5, response, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        prompt_5 = "Perform a compliance check for this design control:\n\nDesign: ".concat(context.designTitle, "\nStandard: ").concat(context.standard, "\nCurrent Phase: ").concat(context.phase, "\n").concat(context.description ? "Description: ".concat(context.description) : '', "\n").concat(context.requirements ? "Requirements: ".concat(context.requirements.join(', ')) : '', "\n\nAnalyze compliance with the specified standard and provide:\n1. Compliance status assessment\n2. Gaps or missing elements\n3. Recommendations for improvement\n4. Risk areas to address");
                        return [4 /*yield*/, this.chat(prompt_5, true)];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.response];
                    case 2:
                        error_10 = _a.sent();
                        console.error('Design compliance check error:', error_10);
                        throw error_10;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate AI-powered action plan (dedicated endpoint with fallback)
     */
    AIAgentService.prototype.generateActionPlanDedicated = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, _b, error_11;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 8]);
                        _a = fetch;
                        _b = ["".concat(this.baseUrl, "/generate-action-plan")];
                        _c = {
                            method: 'POST'
                        };
                        return [4 /*yield*/, this.getHeaders()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.headers = _d.sent(),
                                _c.body = JSON.stringify({
                                    standard_id: context.standardId,
                                    item: context.item,
                                    status: context.status,
                                    findings: context.findings,
                                }),
                                _c)]))];
                    case 2:
                        response = _d.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        // Fallback to chat on endpoint failure
                        console.warn('Action plan endpoint failed, falling back to chat');
                        return [4 /*yield*/, this.generateActionPlan(context)];
                    case 3: return [2 /*return*/, _d.sent()];
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _d.sent()];
                    case 6:
                        error_11 = _d.sent();
                        console.warn('Action plan endpoint error, falling back to chat:', error_11);
                        return [4 /*yield*/, this.generateActionPlan(context)];
                    case 7: return [2 /*return*/, _d.sent()];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze root cause (dedicated endpoint with fallback)
     */
    AIAgentService.prototype.analyzeRootCauseDedicated = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, _b, error_12;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 8]);
                        _a = fetch;
                        _b = ["".concat(this.baseUrl, "/analyze-root-cause")];
                        _c = {
                            method: 'POST'
                        };
                        return [4 /*yield*/, this.getHeaders()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.headers = _d.sent(),
                                _c.body = JSON.stringify({
                                    issue_title: context.title,
                                    description: context.description,
                                    context: context.category,
                                    affected_areas: context.findings ? [context.findings] : undefined,
                                }),
                                _c)]))];
                    case 2:
                        response = _d.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        // Fallback to chat on endpoint failure
                        console.warn('Root cause analysis endpoint failed, falling back to chat');
                        return [4 /*yield*/, this.analyzeRootCause(context)];
                    case 3: return [2 /*return*/, _d.sent()];
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _d.sent()];
                    case 6:
                        error_12 = _d.sent();
                        console.warn('Root cause analysis endpoint error, falling back to chat:', error_12);
                        return [4 /*yield*/, this.analyzeRootCause(context)];
                    case 7: return [2 /*return*/, _d.sent()];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Suggest PDCA improvements (dedicated endpoint with fallback)
     */
    AIAgentService.prototype.suggestPDCAImprovementsDedicated = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, _b, error_13;
            var _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 6, , 8]);
                        _a = fetch;
                        _b = ["".concat(this.baseUrl, "/suggest-pdca-improvements")];
                        _c = {
                            method: 'POST'
                        };
                        return [4 /*yield*/, this.getHeaders()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.headers = _e.sent(),
                                _c.body = JSON.stringify({
                                    process_name: context.title,
                                    current_state: context.description,
                                    problem_identified: context.currentStage,
                                    previous_actions: (_d = context.actions) === null || _d === void 0 ? void 0 : _d.join(', '),
                                }),
                                _c)]))];
                    case 2:
                        response = _e.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        // Fallback to chat on endpoint failure
                        console.warn('PDCA endpoint failed, falling back to chat');
                        return [4 /*yield*/, this.suggestPDCAImprovements(context)];
                    case 3: return [2 /*return*/, _e.sent()];
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _e.sent()];
                    case 6:
                        error_13 = _e.sent();
                        console.warn('PDCA endpoint error, falling back to chat:', error_13);
                        return [4 /*yield*/, this.suggestPDCAImprovements(context)];
                    case 7: return [2 /*return*/, _e.sent()];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Assess survey risk (dedicated endpoint with fallback)
     */
    AIAgentService.prototype.assessSurveyRiskDedicated = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, _b, error_14;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 6, , 8]);
                        _a = fetch;
                        _b = ["".concat(this.baseUrl, "/assess-survey-risk")];
                        _c = {
                            method: 'POST'
                        };
                        return [4 /*yield*/, this.getHeaders()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.headers = _d.sent(),
                                _c.body = JSON.stringify({
                                    standard: context.standard,
                                    organization_area: context.organizationArea,
                                    readiness_level: context.readinessLevel,
                                    critical_concerns: context.criticalConcerns,
                                    survey_date: context.surveyDate,
                                }),
                                _c)]))];
                    case 2:
                        response = _d.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        // Fallback to chat on endpoint failure
                        console.warn('Survey risk endpoint failed, falling back to chat');
                        return [4 /*yield*/, this.assessSurveyRisk(context)];
                    case 3: return [2 /*return*/, _d.sent()];
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _d.sent()];
                    case 6:
                        error_14 = _d.sent();
                        console.warn('Survey risk endpoint error, falling back to chat:', error_14);
                        return [4 /*yield*/, this.assessSurveyRisk(context)];
                    case 7: return [2 /*return*/, _d.sent()];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check design compliance (dedicated endpoint with fallback)
     */
    AIAgentService.prototype.checkDesignComplianceDedicated = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var response, _a, _b, error_15;
            var _c;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 6, , 8]);
                        _a = fetch;
                        _b = ["".concat(this.baseUrl, "/check-design-compliance")];
                        _c = {
                            method: 'POST'
                        };
                        return [4 /*yield*/, this.getHeaders()];
                    case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([(_c.headers = _e.sent(),
                                _c.body = JSON.stringify({
                                    design_element: context.standard,
                                    requirement: ((_d = context.requirements) === null || _d === void 0 ? void 0 : _d.join(', ')) || 'Design control compliance',
                                    current_implementation: context.description || 'Under review',
                                    design_phase: context.phase,
                                }),
                                _c)]))];
                    case 2:
                        response = _e.sent();
                        if (!!response.ok) return [3 /*break*/, 4];
                        // Fallback to chat on endpoint failure
                        console.warn('Design compliance endpoint failed, falling back to chat');
                        return [4 /*yield*/, this.checkDesignCompliance(context)];
                    case 3: return [2 /*return*/, _e.sent()];
                    case 4: return [4 /*yield*/, response.json()];
                    case 5: return [2 /*return*/, _e.sent()];
                    case 6:
                        error_15 = _e.sent();
                        console.warn('Design compliance endpoint error, falling back to chat:', error_15);
                        return [4 /*yield*/, this.checkDesignCompliance(context)];
                    case 7: return [2 /*return*/, _e.sent()];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Reset conversation thread
     */
    AIAgentService.prototype.resetThread = function () {
        this.threadId = null;
    };
    /**
     * Get current thread ID
     */
    AIAgentService.prototype.getThreadId = function () {
        return this.threadId;
    };
    return AIAgentService;
}());
exports.AIAgentService = AIAgentService;
// Export singleton instance
exports.aiAgentService = new AIAgentService();
