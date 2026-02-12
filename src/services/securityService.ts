/**
 * Comprehensive Security Service - AccreditEx
 * 
 * Centralizes security and compliance management with:
 * - Password policy validation
 * - User session management
 * - Activity logging
 * - Compliance monitoring
 * - Security settings management
 */

import { AppSettings, UsersSettings } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { logUserActivity } from './userActivityService';
import { logSettingsChange } from './settingsAuditService';
import { authTokenOptimizer } from './authTokenOptimizer';

export class SecurityService {
  private static instance: SecurityService;

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Password policy validation
  validatePassword(password: string, policy?: AppSettings['passwordPolicy']): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const defaultPolicy = {
      minLength: 8,
      requireUppercase: false,
      requireNumber: false,
      requireSymbol: false,
    };

    const usedPolicy = policy || defaultPolicy;

    if (password.length < usedPolicy.minLength) {
      errors.push(`Password must be at least ${usedPolicy.minLength} characters long`);
    }

    if (usedPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (usedPolicy.requireNumber && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (usedPolicy.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one symbol');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Check password strength
  checkPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
  }

  // Session management
  async checkSessionTimeout(): Promise<boolean> {
    const appStore = useAppStore.getState();
    const usersSettings = appStore.appSettings?.users as UsersSettings;

    if (!usersSettings?.sessionTimeoutMinutes) {
      return false; // No session timeout configured
    }

    const lastActivity = localStorage.getItem('lastActivityTime');
    if (!lastActivity) return false;

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
    const timeoutMs = usersSettings.sessionTimeoutMinutes * 60 * 1000;

    return timeSinceLastActivity > timeoutMs;
  }

  updateLastActivity(): void {
    localStorage.setItem('lastActivityTime', Date.now().toString());
  }

  async logoutDueToInactivity(): Promise<void> {
    try {
      await authTokenOptimizer.logout();
      localStorage.removeItem('lastActivityTime');
      logUserActivity('system', 'session_timeout', 'session', undefined, {
        reason: 'Session timed out due to inactivity',
      });
    } catch (error) {
      console.error('Failed to logout due to inactivity:', error);
    }
  }

  // Account lockout management
  async checkAccountLockout(userId: string): Promise<{
    locked: boolean;
    remainingAttempts: number;
    lockoutTime?: Date;
  }> {
    const appStore = useAppStore.getState();
    const usersSettings = appStore.appSettings?.users as UsersSettings;

    if (!usersSettings?.maxLoginAttempts || usersSettings.maxLoginAttempts <= 0) {
      return { locked: false, remainingAttempts: Infinity };
    }

    const loginAttemptsKey = `loginAttempts_${userId}`;
    const lockoutTimeKey = `lockoutTime_${userId}`;

    const loginAttempts = parseInt(localStorage.getItem(loginAttemptsKey) || '0', 10);
    const lockoutTime = localStorage.getItem(lockoutTimeKey);

    if (lockoutTime) {
      const lockoutEndTime = new Date(parseInt(lockoutTime, 10));
      if (new Date() < lockoutEndTime) {
        return {
          locked: true,
          remainingAttempts: 0,
          lockoutTime: lockoutEndTime,
        };
      }
      // Lockout period expired, reset attempts
      this.resetLoginAttempts(userId);
      return { locked: false, remainingAttempts: usersSettings.maxLoginAttempts };
    }

    const remainingAttempts = usersSettings.maxLoginAttempts - loginAttempts;
    return {
      locked: loginAttempts >= usersSettings.maxLoginAttempts,
      remainingAttempts,
    };
  }

  async recordFailedLoginAttempt(userId: string): Promise<void> {
    const appStore = useAppStore.getState();
    const usersSettings = appStore.appSettings?.users as UsersSettings;

    if (!usersSettings?.maxLoginAttempts) {
      return;
    }

    const loginAttemptsKey = `loginAttempts_${userId}`;
    const currentAttempts = parseInt(localStorage.getItem(loginAttemptsKey) || '0', 10);
    const newAttempts = currentAttempts + 1;

    localStorage.setItem(loginAttemptsKey, newAttempts.toString());

    if (newAttempts >= usersSettings.maxLoginAttempts && usersSettings.lockoutDurationMinutes > 0) {
      const lockoutTimeKey = `lockoutTime_${userId}`;
      const lockoutEndTime = new Date(
        Date.now() + usersSettings.lockoutDurationMinutes * 60 * 1000
      );
      localStorage.setItem(lockoutTimeKey, lockoutEndTime.getTime().toString());

      logUserActivity(userId, 'account_locked', 'user', userId, {
        reason: 'Too many failed login attempts',
        lockoutDuration: usersSettings.lockoutDurationMinutes,
      });
    }
  }

  resetLoginAttempts(userId: string): void {
    localStorage.removeItem(`loginAttempts_${userId}`);
    localStorage.removeItem(`lockoutTime_${userId}`);
  }

  // Security event logging
  logSecurityEvent(
    userId: string,
    eventType: string,
    resource: string,
    resourceId?: string,
    details?: any,
  ): void {
    logUserActivity(userId, eventType, resource, resourceId, details);
  }

  logSettingsChange(
    userId: string,
    userName: string,
    action: 'create' | 'update' | 'delete' | 'export' | 'import',
    category: string,
    field: string,
    oldValue: any,
    newValue: any,
  ): void {
    logSettingsChange(userId, userName, action, category, field, oldValue, newValue);
  }

  // Security settings validation
  validateSecuritySettings(settings: Partial<UsersSettings>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (settings.sessionTimeoutMinutes !== undefined) {
      if (settings.sessionTimeoutMinutes < 0 || settings.sessionTimeoutMinutes > 1440) {
        errors.push('Session timeout must be between 0 and 1440 minutes');
      }
    }

    if (settings.maxLoginAttempts !== undefined) {
      if (settings.maxLoginAttempts < 0 || settings.maxLoginAttempts > 10) {
        errors.push('Max login attempts must be between 0 and 10');
      }
    }

    if (settings.lockoutDurationMinutes !== undefined) {
      if (settings.lockoutDurationMinutes < 0 || settings.lockoutDurationMinutes > 60) {
        errors.push('Lockout duration must be between 0 and 60 minutes');
      }
    }

    if (settings.inactivityThresholdDays !== undefined) {
      if (settings.inactivityThresholdDays < 0 || settings.inactivityThresholdDays > 365) {
        errors.push('Inactivity threshold must be between 0 and 365 days');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Security headers and policies
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  }

  // Compliance monitoring
  async checkCompliance(): Promise<{
    compliant: boolean;
    issues: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
    }>;
  }> {
    const appStore = useAppStore.getState();
    const issues: any[] = [];

    // Check password policy strength
    const passwordPolicy = appStore.appSettings?.passwordPolicy;
    if (passwordPolicy && passwordPolicy.minLength < 12) {
      issues.push({
        category: 'Password Policy',
        severity: 'medium',
        description: 'Password minimum length is less than 12 characters',
        recommendation: 'Increase minimum password length to at least 12 characters',
      });
    }

    if (!passwordPolicy?.requireUppercase || !passwordPolicy?.requireNumber || !passwordPolicy?.requireSymbol) {
      issues.push({
        category: 'Password Policy',
        severity: 'high',
        description: 'Password policy does not require all character types',
        recommendation: 'Enable requirements for uppercase, number, and symbol characters',
      });
    }

    // Check session timeout
    const usersSettings = appStore.appSettings?.users as UsersSettings;
    if (!usersSettings?.sessionTimeoutMinutes || usersSettings.sessionTimeoutMinutes > 60) {
      issues.push({
        category: 'Session Management',
        severity: 'medium',
        description: 'Session timeout is not configured or is too long',
        recommendation: 'Set session timeout to 30-60 minutes',
      });
    }

    // Check login attempts
    if (!usersSettings?.maxLoginAttempts || usersSettings.maxLoginAttempts > 5) {
      issues.push({
        category: 'Account Security',
        severity: 'high',
        description: 'Max login attempts are not configured or too high',
        recommendation: 'Set max login attempts to 5 or less',
      });
    }

    // Check lockout duration
    if (!usersSettings?.lockoutDurationMinutes || usersSettings.lockoutDurationMinutes < 15) {
      issues.push({
        category: 'Account Security',
        severity: 'medium',
        description: 'Account lockout duration is too short',
        recommendation: 'Set lockout duration to at least 15 minutes',
      });
    }

    return {
      compliant: issues.length === 0,
      issues,
    };
  }

  // Data protection and encryption
  async encryptData(data: string, key: string): Promise<string> {
    // Simple encryption for demonstration (in real app, use proper encryption)
    return btoa(data);
  }

  async decryptData(encrypted: string, key: string): Promise<string> {
    return atob(encrypted);
  }

  // Audit trail management
  async getSecurityAuditLog(
    startTime?: Date,
    endTime?: Date,
    eventType?: string,
  ): Promise<any[]> {
    // In real app, this would query the audit log
    return [];
  }

  // Security best practices checks
  async runSecurityScan(): Promise<{
    scanDate: Date;
    status: 'pass' | 'fail' | 'warning';
    vulnerabilities: any[];
    recommendations: any[];
  }> {
    const complianceResult = await this.checkCompliance();

    return {
      scanDate: new Date(),
      status: complianceResult.issues.length > 0 ? 'warning' : 'pass',
      vulnerabilities: complianceResult.issues,
      recommendations: complianceResult.issues.map(issue => issue.recommendation),
    };
  }

  // Two-factor authentication management
  async enableTwoFactorAuth(userId: string, method: 'sms' | 'email' | 'authenticator'): Promise<void> {
    // Implementation for 2FA
    logUserActivity(userId, 'enable_2fa', 'user', userId, { method });
  }

  async disableTwoFactorAuth(userId: string): Promise<void> {
    logUserActivity(userId, 'disable_2fa', 'user', userId);
  }

  async verifyTwoFactorAuth(userId: string, code: string): Promise<boolean> {
    // Implementation for 2FA verification
    return true; // Mock implementation
  }
}

export const securityService = SecurityService.getInstance();
