/**
 * Firebase Free Tier Usage Monitoring
 * Tracks Firestore reads/writes to stay within free tier limits
 * 
 * FREE TIER LIMITS (Monthly):
 * - Reads: 50,000
 * - Writes: 20,000
 * - Deletes: 20,000
 * - Storage: 1 GB
 */

interface UsageStats {
  reads: number;
  writes: number;
  deletes: number;
  timestamp: number;
  estimatedCostUSD?: number;
}

interface DailyStats {
  date: string;
  reads: number;
  writes: number;
  deletes: number;
}

class FirebaseFreetierMonitor {
  private stats: UsageStats = {
    reads: 0,
    writes: 0,
    deletes: 0,
    timestamp: Date.now(),
  };

  private dailyStats: Map<string, DailyStats> = new Map();
  private readonly storageKey = 'firebase-usage-stats';

  // Free tier limits
  private readonly FREE_TIER = {
    readsPerMonth: 50000,
    writesPerMonth: 20000,
    deletesPerMonth: 20000,
    storageGB: 1,
  };

  // Pricing after free tier (rough estimates)
  private readonly PAID_PRICING = {
    perMillionReads: 0.06,
    perMillionWrites: 0.18,
    perMillionDeletes: 0.02,
    perGB: 0.18,
  };

  constructor() {
    this.loadStats();
  }

  /**
   * Record a read operation
   */
  recordRead(count: number = 1): void {
    this.stats.reads += count;
    this.recordDaily('reads', count);
    this.checkThreshold('reads');
  }

  /**
   * Record a write operation
   */
  recordWrite(count: number = 1): void {
    this.stats.writes += count;
    this.recordDaily('writes', count);
    this.checkThreshold('writes');
  }

  /**
   * Record a delete operation
   */
  recordDelete(count: number = 1): void {
    this.stats.deletes += count;
    this.recordDaily('deletes', count);
    this.checkThreshold('deletes');
  }

  /**
   * Get current usage statistics
   */
  getStats(): object {
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = this.dailyStats.get(today) || {
      date: today,
      reads: 0,
      writes: 0,
      deletes: 0,
    };

    return {
      monthly: this.stats,
      daily: dailyStats,
      freeTierRemaining: {
        reads: this.FREE_TIER.readsPerMonth - this.stats.reads,
        writes: this.FREE_TIER.writesPerMonth - this.stats.writes,
        deletes: this.FREE_TIER.deletesPerMonth - this.stats.deletes,
      },
      estimatedCost: this.calculateCost(),
      percentageUsed: {
        reads: ((this.stats.reads / this.FREE_TIER.readsPerMonth) * 100).toFixed(2) + '%',
        writes: ((this.stats.writes / this.FREE_TIER.writesPerMonth) * 100).toFixed(2) + '%',
        deletes: ((this.stats.deletes / this.FREE_TIER.deletesPerMonth) * 100).toFixed(2) + '%',
      }
    };
  }

  /**
   * Get usage per hour for rate limiting
   */
  getHourlyRate(): object {
    const now = Date.now();
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const daysInMonth = (now - startOfMonth) / (1000 * 60 * 60 * 24);
    const estimatedDays = Math.max(daysInMonth, 1);

    return {
      readsPerDay: (this.stats.reads / estimatedDays).toFixed(0),
      writesPerDay: (this.stats.writes / estimatedDays).toFixed(0),
      deletesPerDay: (this.stats.deletes / estimatedDays).toFixed(0),
      projectedMonthlyReads: (this.stats.reads / estimatedDays * 30).toFixed(0),
      projectedMonthlyCost: this.calculateCost(),
      willExceedFreeTier: {
        reads: (this.stats.reads / estimatedDays * 30) > this.FREE_TIER.readsPerMonth,
        writes: (this.stats.writes / estimatedDays * 30) > this.FREE_TIER.writesPerMonth,
        deletes: (this.stats.deletes / estimatedDays * 30) > this.FREE_TIER.deletesPerMonth,
      }
    };
  }

  /**
   * Reset monthly stats (call once per month)
   */
  resetMonthlyStats(): void {
    console.log('Resetting monthly stats');
    this.stats = {
      reads: 0,
      writes: 0,
      deletes: 0,
      timestamp: Date.now(),
    };
    this.saveStats();
  }

  /**
   * Export stats for analysis
   */
  exportStats(): string {
    return JSON.stringify({
      stats: this.stats,
      daily: Array.from(this.dailyStats.values()),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Get warnings for approaching limits
   */
  getWarnings(): string[] {
    const warnings: string[] = [];

    if (this.stats.reads > this.FREE_TIER.readsPerMonth * 0.8) {
      warnings.push(`⚠️ Approaching read limit: ${this.stats.reads} / ${this.FREE_TIER.readsPerMonth}`);
    }

    if (this.stats.writes > this.FREE_TIER.writesPerMonth * 0.8) {
      warnings.push(`⚠️ Approaching write limit: ${this.stats.writes} / ${this.FREE_TIER.writesPerMonth}`);
    }

    if (this.stats.deletes > this.FREE_TIER.deletesPerMonth * 0.8) {
      warnings.push(`⚠️ Approaching delete limit: ${this.stats.deletes} / ${this.FREE_TIER.deletesPerMonth}`);
    }

    return warnings;
  }

  /**
   * Private methods
   */

  private recordDaily(type: 'reads' | 'writes' | 'deletes', count: number): void {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.dailyStats.get(today) || {
      date: today,
      reads: 0,
      writes: 0,
      deletes: 0,
    };

    existing[type] += count;
    this.dailyStats.set(today, existing);
    this.saveStats();
  }

  private checkThreshold(type: string): void {
    const thresholds = {
      reads: this.FREE_TIER.readsPerMonth * 0.9,
      writes: this.FREE_TIER.writesPerMonth * 0.9,
      deletes: this.FREE_TIER.deletesPerMonth * 0.9,
    };

    const current = this.stats[type as keyof UsageStats] || 0;
    const threshold = thresholds[type as keyof typeof thresholds] || Infinity;
    if (current > threshold) {
      console.warn(`[ALERT] ${type} usage at 90% of free tier limit!`);
    }
  }

  private calculateCost(): number {
    const excessReads = Math.max(0, this.stats.reads - this.FREE_TIER.readsPerMonth);
    const excessWrites = Math.max(0, this.stats.writes - this.FREE_TIER.writesPerMonth);
    const excessDeletes = Math.max(0, this.stats.deletes - this.FREE_TIER.deletesPerMonth);

    return (
      (excessReads / 1000000) * this.PAID_PRICING.perMillionReads +
      (excessWrites / 1000000) * this.PAID_PRICING.perMillionWrites +
      (excessDeletes / 1000000) * this.PAID_PRICING.perMillionDeletes
    );
  }

  private saveStats(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        stats: this.stats,
        daily: Array.from(this.dailyStats.entries()),
      }));
    } catch (error) {
      console.error('Failed to save usage stats:', error);
    }
  }

  private loadStats(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.stats = parsed.stats;
        this.dailyStats = new Map(parsed.daily || []);
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  }
}

// Export singleton instance
export const freeTierMonitor = new FirebaseFreetierMonitor();

// Log warnings on startup
console.log('Firebase Free Tier Monitor - Current Usage:', freeTierMonitor.getStats());
freeTierMonitor.getWarnings().forEach(warning => console.warn(warning));
