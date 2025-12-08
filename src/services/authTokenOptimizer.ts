/**
 * Firebase Authentication Token Optimization
 * Manages token refresh, expiry, and reduces unnecessary auth rechecks
 */

import { Auth, onAuthStateChanged, signOut } from 'firebase/auth';

interface TokenState {
  isAuthenticated: boolean;
  lastCheckTime: number;
  tokenExpiryTime?: number;
  userId?: string;
}

class AuthTokenOptimizer {
  private auth: Auth | null = null;
  private tokenState: TokenState = {
    isAuthenticated: false,
    lastCheckTime: 0,
  };
  private checkInterval = 5 * 60 * 1000; // 5 minutes between rechecks
  private unsubscribe: (() => void) | null = null;
  private listeners: ((authenticated: boolean) => void)[] = [];

  /**
   * Initialize auth optimizer with Firebase Auth instance
   */
  initialize(auth: Auth): void {
    this.auth = auth;
    this.setupAuthListener();
  }

  /**
   * Setup single auth listener (instead of per-component)
   * Dramatically reduces unnecessary rechecks
   */
  private setupAuthListener(): void {
    if (!this.auth) return;

    this.unsubscribe = onAuthStateChanged(this.auth, (user) => {
      const isAuthenticated = !!user;
      
      this.tokenState = {
        isAuthenticated,
        lastCheckTime: Date.now(),
        userId: user?.uid,
        tokenExpiryTime: user ? this.calculateTokenExpiry() : undefined,
      };

      // Notify all listeners at once
      this.notifyListeners(isAuthenticated);
    });
  }

  /**
   * Subscribe to auth state changes
   * Use this instead of setting up individual onAuthStateChanged listeners
   */
  onAuthStateChange(callback: (authenticated: boolean) => void): () => void {
    this.listeners.push(callback);

    // Immediately call with current state
    callback(this.tokenState.isAuthenticated);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Get current auth state without triggering auth check
   * Safe to call frequently
   */
  getAuthState() {
    return {
      isAuthenticated: this.tokenState.isAuthenticated,
      userId: this.tokenState.userId,
      lastChecked: new Date(this.tokenState.lastCheckTime),
      tokenExpiresAt: this.tokenState.tokenExpiryTime ? new Date(this.tokenState.tokenExpiryTime) : undefined,
    };
  }

  /**
   * Check if token is expired or about to expire
   * Returns true if token is still valid (with 5 min buffer)
   */
  isTokenValid(): boolean {
    if (!this.tokenState.tokenExpiryTime) {
      return this.tokenState.isAuthenticated;
    }

    const bufferMs = 5 * 60 * 1000; // 5 minute buffer
    return Date.now() < (this.tokenState.tokenExpiryTime - bufferMs);
  }

  /**
   * Manually refresh token (called automatically when needed)
   */
  async refreshToken(): Promise<boolean> {
    if (!this.auth?.currentUser) {
      return false;
    }

    try {
      // Firebase automatically refreshes tokens on operations
      // Manual refresh is rarely needed
      await this.auth.currentUser.getIdToken(true);
      this.tokenState.tokenExpiryTime = this.calculateTokenExpiry();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Sign out and cleanup
   */
  async logout(): Promise<void> {
    if (!this.auth) return;
    
    try {
      await signOut(this.auth);
      this.tokenState = {
        isAuthenticated: false,
        lastCheckTime: Date.now(),
      };
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup listeners on app destroy
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.listeners = [];
  }

  /**
   * Private methods
   */

  private notifyListeners(isAuthenticated: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isAuthenticated);
      } catch (error) {
        console.error('Auth listener error:', error);
      }
    });
  }

  private calculateTokenExpiry(): number {
    // Firebase tokens expire in 1 hour
    return Date.now() + (60 * 60 * 1000);
  }
}

export const authTokenOptimizer = new AuthTokenOptimizer();
