/**
 * Draft Manager Service
 * Handles auto-save and recovery of form drafts using localStorage
 */

export interface DraftData {
  formId: string;
  userId: string;
  data: Record<string, any>;
  timestamp: number;
  expiresAt: number;
}

const DRAFT_PREFIX = 'accreditex_draft_';
const DEFAULT_EXPIRY_DAYS = 7;

export class DraftManager {
  /**
   * Save a draft to localStorage
   */
  static saveDraft(
    formId: string,
    userId: string,
    data: Record<string, any>,
    expiryDays: number = DEFAULT_EXPIRY_DAYS
  ): void {
    try {
      const draft: DraftData = {
        formId,
        userId,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (expiryDays * 24 * 60 * 60 * 1000)
      };

      const key = this.getDraftKey(formId, userId);
      localStorage.setItem(key, JSON.stringify(draft));
      
      console.log(`✅ Draft saved for ${formId}`, draft);
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
    }
  }

  /**
   * Load a draft from localStorage
   */
  static loadDraft(formId: string, userId: string): DraftData | null {
    try {
      const key = this.getDraftKey(formId, userId);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const draft: DraftData = JSON.parse(stored);

      // Check if draft has expired
      if (Date.now() > draft.expiresAt) {
        console.log(`🗑️ Draft expired for ${formId}, removing...`);
        this.deleteDraft(formId, userId);
        return null;
      }

      console.log(`📄 Draft loaded for ${formId}`, draft);
      return draft;
    } catch (error) {
      console.error('❌ Failed to load draft:', error);
      return null;
    }
  }

  /**
   * Delete a draft from localStorage
   */
  static deleteDraft(formId: string, userId: string): void {
    try {
      const key = this.getDraftKey(formId, userId);
      localStorage.removeItem(key);
      console.log(`🗑️ Draft deleted for ${formId}`);
    } catch (error) {
      console.error('❌ Failed to delete draft:', error);
    }
  }

  /**
   * Check if a draft exists
   */
  static hasDraft(formId: string, userId: string): boolean {
    const draft = this.loadDraft(formId, userId);
    return draft !== null;
  }

  /**
   * Clean up all expired drafts
   */
  static cleanupExpiredDrafts(): void {
    try {
      const keys = Object.keys(localStorage);
      let cleanedCount = 0;

      keys.forEach(key => {
        if (key.startsWith(DRAFT_PREFIX)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const draft: DraftData = JSON.parse(stored);
              if (Date.now() > draft.expiresAt) {
                localStorage.removeItem(key);
                cleanedCount++;
              }
            }
          } catch (e) {
            // Invalid draft, remove it
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      });

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired drafts`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup expired drafts:', error);
    }
  }

  /**
   * Get all drafts for a user
   */
  static getUserDrafts(userId: string): DraftData[] {
    try {
      const keys = Object.keys(localStorage);
      const drafts: DraftData[] = [];

      keys.forEach(key => {
        if (key.startsWith(DRAFT_PREFIX) && key.includes(userId)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const draft: DraftData = JSON.parse(stored);
              if (Date.now() <= draft.expiresAt) {
                drafts.push(draft);
              }
            }
          } catch (e) {
            // Skip invalid drafts
          }
        }
      });

      return drafts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ Failed to get user drafts:', error);
      return [];
    }
  }

  /**
   * Get the localStorage key for a draft
   */
  private static getDraftKey(formId: string, userId: string): string {
    return `${DRAFT_PREFIX}${formId}_${userId}`;
  }

  /**
   * Format timestamp for display
   */
  static formatDraftAge(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Auto-cleanup on app load
if (typeof window !== 'undefined') {
  DraftManager.cleanupExpiredDrafts();
}
