/**
 * HIS Sync Scheduler
 * Manages scheduled synchronization tasks with cron-like patterns
 * Supports one-time, recurring, and interval-based scheduling
 */

import { HISConfig, SyncStatus } from './types';
import { hisDataSyncService } from './HISDataSyncService';

interface ScheduledTask {
  id: string;
  configId: string;
  resourceType: string;
  direction: 'pull' | 'push' | 'bidirectional';
  schedule: ScheduleConfig;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runsCompleted: number;
  runsFailed: number;
}

interface ScheduleConfig {
  type: 'interval' | 'cron' | 'daily' | 'weekly' | 'monthly' | 'once';
  value?: number; // For interval: milliseconds
  time?: string; // HH:MM format for daily/weekly/monthly
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  cronExpression?: string; // For cron type
}

export class HISSyncScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.loadScheduledTasks();
  }

  /**
   * Create a new scheduled sync task
   */
  createScheduledTask(
    configId: string,
    resourceType: string,
    direction: 'pull' | 'push' | 'bidirectional',
    schedule: ScheduleConfig
  ): ScheduledTask {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: ScheduledTask = {
      id: taskId,
      configId,
      resourceType,
      direction,
      schedule,
      enabled: true,
      runsCompleted: 0,
      runsFailed: 0,
    };

    this.tasks.set(taskId, task);
    this.calculateNextRun(task);
    this.saveScheduledTasks();

    if (this.isRunning) {
      this.scheduleTask(task);
    }

    return task;
  }

  /**
   * Get a scheduled task by ID
   */
  getTask(taskId: string): ScheduledTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all scheduled tasks for a configuration
   */
  getTasksForConfig(configId: string): ScheduledTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.configId === configId);
  }

  /**
   * Get all scheduled tasks
   */
  getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Enable a scheduled task
   */
  enableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = true;
      this.calculateNextRun(task);
      this.saveScheduledTasks();

      if (this.isRunning) {
        this.scheduleTask(task);
      }
      return true;
    }
    return false;
  }

  /**
   * Disable a scheduled task
   */
  disableTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = false;
      this.clearTaskTimer(taskId);
      this.saveScheduledTasks();
      return true;
    }
    return false;
  }

  /**
   * Update a scheduled task
   */
  updateTask(taskId: string, updates: Partial<ScheduledTask>): boolean {
    const task = this.tasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      this.calculateNextRun(task);
      this.saveScheduledTasks();

      // Reschedule if running
      if (this.isRunning) {
        this.clearTaskTimer(taskId);
        this.scheduleTask(task);
      }
      return true;
    }
    return false;
  }

  /**
   * Delete a scheduled task
   */
  deleteTask(taskId: string): boolean {
    this.clearTaskTimer(taskId);
    const deleted = this.tasks.delete(taskId);
    if (deleted) {
      this.saveScheduledTasks();
    }
    return deleted;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.tasks.forEach((task) => {
      if (task.enabled) {
        this.scheduleTask(task);
      }
    });

    console.log('[HISSyncScheduler] Scheduler started with', this.tasks.size, 'tasks');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.isRunning = false;
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
    console.log('[HISSyncScheduler] Scheduler stopped');
  }

  /**
   * Execute a scheduled task immediately
   */
  async executeTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    try {
      const result = await hisDataSyncService.startSync(
        task.configId,
        task.resourceType,
        task.direction
      );

      task.lastRun = new Date();
      if (result.status === SyncStatus.SUCCESS) {
        task.runsCompleted++;
      } else {
        task.runsFailed++;
      }

      this.calculateNextRun(task);
      this.saveScheduledTasks();

      // Reschedule if running
      if (this.isRunning && task.enabled) {
        this.clearTaskTimer(taskId);
        this.scheduleTask(task);
      }

      return result.status === SyncStatus.SUCCESS;
    } catch (error) {
      task.runsFailed++;
      this.saveScheduledTasks();
      console.error('[HISSyncScheduler] Error executing task:', error);
      return false;
    }
  }

  /**
   * Schedule a task for execution
   */
  private scheduleTask(task: ScheduledTask): void {
    if (!task.enabled || !task.nextRun) return;

    const now = new Date();
    let delayMs = Math.max(0, task.nextRun.getTime() - now.getTime());

    // Cap delay at 24 hours to prevent overflow
    delayMs = Math.min(delayMs, 24 * 60 * 60 * 1000);

    const timer = setTimeout(() => {
      this.executeTask(task.id).then(() => {
        // Reschedule if task still exists and is enabled
        if (this.tasks.has(task.id) && task.enabled) {
          const updatedTask = this.tasks.get(task.id)!;
          this.scheduleTask(updatedTask);
        }
      });
    }, delayMs);

    this.timers.set(task.id, timer);
  }

  /**
   * Clear timer for a task
   */
  private clearTaskTimer(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }
  }

  /**
   * Calculate next run time for a task
   */
  private calculateNextRun(task: ScheduledTask): void {
    const now = new Date();

    switch (task.schedule.type) {
      case 'interval':
        task.nextRun = new Date(now.getTime() + (task.schedule.value || 3600000));
        break;

      case 'once':
        // One-time task should not be rescheduled
        if (task.lastRun) {
          task.enabled = false;
        }
        break;

      case 'daily':
        task.nextRun = this.getNextTimeOfDay(task.schedule.time || '00:00');
        break;

      case 'weekly':
        task.nextRun = this.getNextDayOfWeek(
          task.schedule.dayOfWeek || 0,
          task.schedule.time || '00:00'
        );
        break;

      case 'monthly':
        task.nextRun = this.getNextDayOfMonth(
          task.schedule.dayOfMonth || 1,
          task.schedule.time || '00:00'
        );
        break;

      case 'cron':
        task.nextRun = this.getNextCronRun(task.schedule.cronExpression || '0 0 * * *');
        break;
    }
  }

  /**
   * Get next occurrence of time on today or tomorrow
   */
  private getNextTimeOfDay(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    if (next <= new Date()) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Get next occurrence of day of week
   */
  private getNextDayOfWeek(dayOfWeek: number, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);

    let daysToAdd = dayOfWeek - next.getDay();
    if (daysToAdd < 0 || (daysToAdd === 0 && next <= new Date())) {
      daysToAdd += 7;
    }

    next.setDate(next.getDate() + daysToAdd);
    return next;
  }

  /**
   * Get next occurrence of day of month
   */
  private getNextDayOfMonth(dayOfMonth: number, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    next.setDate(dayOfMonth);

    if (next <= new Date()) {
      next.setMonth(next.getMonth() + 1);
    }

    return next;
  }

  /**
   * Get next run based on cron expression
   * Simple implementation supporting: minute hour day month dayOfWeek
   */
  private getNextCronRun(cronExpression: string): Date {
    // Basic cron parsing: "minute hour day month dayOfWeek"
    // Example: "0 2 * * *" = 2:00 AM daily
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      // Invalid cron, default to 1 hour from now
      return new Date(Date.now() + 3600000);
    }

    const [minuteStr, hourStr] = parts;
    const minute = minuteStr === '*' ? new Date().getMinutes() : parseInt(minuteStr);
    const hour = hourStr === '*' ? new Date().getHours() : parseInt(hourStr);

    const next = new Date();
    next.setHours(hour, minute, 0, 0);

    if (next <= new Date()) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Get scheduler statistics
   */
  getStatistics() {
    const allTasks = Array.from(this.tasks.values());
    return {
      totalTasks: allTasks.length,
      enabledTasks: allTasks.filter((t) => t.enabled).length,
      disabledTasks: allTasks.filter((t) => !t.enabled).length,
      totalRuns: allTasks.reduce((sum, t) => sum + t.runsCompleted + t.runsFailed, 0),
      successfulRuns: allTasks.reduce((sum, t) => sum + t.runsCompleted, 0),
      failedRuns: allTasks.reduce((sum, t) => sum + t.runsFailed, 0),
      upcomingTasks: allTasks
        .filter((t) => t.enabled && t.nextRun)
        .sort((a, b) => (a.nextRun!.getTime() - b.nextRun!.getTime()))
        .slice(0, 10),
    };
  }

  /**
   * Load scheduled tasks from storage
   */
  private loadScheduledTasks(): void {
    try {
      const stored = localStorage.getItem('his_scheduled_tasks');
      if (stored) {
        const parsed = JSON.parse(stored) as Array<ScheduledTask>;
        parsed.forEach((task) => {
          task.lastRun = task.lastRun ? new Date(task.lastRun) : undefined;
          task.nextRun = task.nextRun ? new Date(task.nextRun) : undefined;
          this.tasks.set(task.id, task);
        });
      }
    } catch (error) {
      console.error('[HISSyncScheduler] Failed to load scheduled tasks:', error);
    }
  }

  /**
   * Save scheduled tasks to storage
   */
  private saveScheduledTasks(): void {
    try {
      const tasksArray = Array.from(this.tasks.values());
      localStorage.setItem('his_scheduled_tasks', JSON.stringify(tasksArray));
    } catch (error) {
      console.error('[HISSyncScheduler] Failed to save scheduled tasks:', error);
    }
  }
}

// Singleton instance
export const hisSyncScheduler = new HISSyncScheduler();
