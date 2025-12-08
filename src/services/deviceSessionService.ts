import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  updateDoc,
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { freeTierMonitor } from '@/services/freeTierMonitor';

export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  os: string;
  loginTime: string;
  lastActive: string;
  ipAddress?: string;
  location?: string;
}

class DeviceSessionService {
  private readonly MAX_SESSIONS = 10;
  private readonly SESSION_TIMEOUT_DAYS = 30;

  /**
   * Generate a unique device ID based on browser fingerprint
   */
  private generateDeviceId(): string {
    const nav = navigator;
    const screen = window.screen;
    
    const fingerprint = [
      nav.userAgent,
      nav.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
    ].join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `device_${Math.abs(hash)}`;
  }

  /**
   * Parse user agent to extract browser and OS info
   */
  private parseUserAgent(): { browser: string; os: string; deviceName: string } {
    const ua = navigator.userAgent;
    
    // Detect browser
    let browser = 'Unknown';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    
    // Detect OS
    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    const deviceName = `${browser} on ${os}`;
    
    return { browser, os, deviceName };
  }

  /**
   * Get approximate location from IP (using free API)
   */
  private async getLocation(): Promise<string> {
    try {
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(3000)
      });
      const data = await response.json();
      return data.city && data.country_name 
        ? `${data.city}, ${data.country_name}` 
        : 'Unknown';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Create or update a device session
   */
  async createOrUpdateSession(userId: string): Promise<string> {
    try {
      const deviceId = this.generateDeviceId();
      const { browser, os, deviceName } = this.parseUserAgent();
      const now = new Date().toISOString();
      
      // Get location in background (don't block login)
      const locationPromise = this.getLocation();
      
      const sessionRef = doc(db, 'users', userId, 'sessions', deviceId);
      
      const sessionData: Partial<DeviceSession> = {
        userId,
        deviceName,
        browser,
        os,
        lastActive: now,
      };

      // Check if session exists
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const q = query(sessionsRef, where('__name__', '==', deviceId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // New session
        sessionData.loginTime = now;
        
        // Check session limit before creating
        await this.enforceSessionLimit(userId);
        
        // Get location and add to session
        const location = await locationPromise;
        sessionData.location = location;
        
        await setDoc(sessionRef, sessionData);
        freeTierMonitor.recordWrite(1);
      } else {
        // Update existing session
        await updateDoc(sessionRef, { lastActive: now });
        freeTierMonitor.recordWrite(1);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Failed to create/update session:', error);
      throw error;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<DeviceSession[]> {
    try {
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const q = query(sessionsRef, orderBy('lastActive', 'desc'));
      const snapshot = await getDocs(q);
      
      freeTierMonitor.recordRead(snapshot.size);
      
      const sessions: DeviceSession[] = [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.SESSION_TIMEOUT_DAYS);
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const lastActive = new Date(data.lastActive);
        
        // Filter out expired sessions
        if (lastActive > cutoffDate) {
          sessions.push({
            id: doc.id,
            ...data,
          } as DeviceSession);
        }
      });
      
      return sessions;
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Get current device session ID
   */
  getCurrentDeviceId(): string {
    return this.generateDeviceId();
  }

  /**
   * Update last active time for current session
   */
  async updateLastActive(userId: string): Promise<void> {
    try {
      const deviceId = this.generateDeviceId();
      const sessionRef = doc(db, 'users', userId, 'sessions', deviceId);
      
      await updateDoc(sessionRef, {
        lastActive: new Date().toISOString(),
      });
      
      freeTierMonitor.recordWrite(1);
    } catch (error) {
      // Silently fail - not critical
      console.debug('Failed to update last active:', error);
    }
  }

  /**
   * Sign out a specific device
   */
  async signOutDevice(userId: string, deviceId: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'users', userId, 'sessions', deviceId);
      await deleteDoc(sessionRef);
      freeTierMonitor.recordDelete(1);
    } catch (error) {
      console.error('Failed to sign out device:', error);
      throw error;
    }
  }

  /**
   * Sign out all other devices (keep current)
   */
  async signOutAllOtherDevices(userId: string): Promise<number> {
    try {
      const currentDeviceId = this.generateDeviceId();
      const sessions = await this.getUserSessions(userId);
      
      let count = 0;
      for (const session of sessions) {
        if (session.id !== currentDeviceId) {
          await this.signOutDevice(userId, session.id);
          count++;
        }
      }
      
      return count;
    } catch (error) {
      console.error('Failed to sign out all devices:', error);
      throw error;
    }
  }

  /**
   * Sign out all devices including current
   */
  async signOutAllDevices(userId: string): Promise<number> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      for (const session of sessions) {
        await this.signOutDevice(userId, session.id);
      }
      
      return sessions.length;
    } catch (error) {
      console.error('Failed to sign out all devices:', error);
      throw error;
    }
  }

  /**
   * Clean up old sessions (called automatically)
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      // Remove oldest sessions if limit exceeded
      if (sessions.length >= this.MAX_SESSIONS) {
        const sessionsToRemove = sessions.slice(this.MAX_SESSIONS - 1);
        
        for (const session of sessionsToRemove) {
          await this.signOutDevice(userId, session.id);
        }
      }
    } catch (error) {
      console.error('Failed to enforce session limit:', error);
    }
  }

  /**
   * Check if current device is still in active sessions
   */
  async isCurrentDeviceActive(userId: string): Promise<boolean> {
    try {
      const currentDeviceId = this.generateDeviceId();
      const sessions = await this.getUserSessions(userId);
      
      return sessions.some(session => session.id === currentDeviceId);
    } catch (error) {
      return true; // Assume active on error to avoid unnecessary logouts
    }
  }

  /**
   * Periodic cleanup of expired sessions
   */
  async cleanupExpiredSessions(userId: string): Promise<number> {
    try {
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const snapshot = await getDocs(sessionsRef);
      
      freeTierMonitor.recordRead(snapshot.size);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.SESSION_TIMEOUT_DAYS);
      
      let cleaned = 0;
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const lastActive = new Date(data.lastActive);
        
        if (lastActive < cutoffDate) {
          await deleteDoc(doc(db, 'users', userId, 'sessions', docSnap.id));
          freeTierMonitor.recordDelete(1);
          cleaned++;
        }
      }
      
      return cleaned;
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }
}

export const deviceSessionService = new DeviceSessionService();
