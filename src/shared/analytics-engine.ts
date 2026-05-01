/**
 * Advanced Analytics System
 * 
 * Track voice usage patterns:
 * - Which wake words are used most
 * - Popular voice configurations
 * - Recognition accuracy trends
 * - User behavior patterns
 * - Performance metrics
 * 
 * NO telemetry sent to cloud - all local tracking
 */

import { EventEmitter } from 'events';
import { VoiceParameters } from './kokoro-tts';

export interface AnalyticsEvent {
  type: 'wake-word' | 'voice-generated' | 'speech-recognized' | 'command-executed' | 'error' | 'performance';
  timestamp: number;
  data: any;
}

export interface WakeWordStats {
  phrase: string;
  detectionCount: number;
  successRate: number; // 0-1
  avgConfidence: number;
  lastDetected: number;
}

export interface VoiceStats {
  name: string;
  usageCount: number;
  params: VoiceParameters;
  lastUsed: number;
  totalDuration: number; // seconds
}

export interface CommandStats {
  command: string;
  executionCount: number;
  successRate: number;
  avgExecutionTime: number; // ms
}

export interface PerformanceMetrics {
  wakeWordLatency: number[]; // ms per detection
  synthesisTime: number[]; // ms per synthesis
  memoryUsage: number[]; // MB
  cpuUsage: number[]; // %
  accuracyScores: number[]; // 0-1
}

/**
 * AnalyticsEngine: Track voice usage locally
 */
export class AnalyticsEngine extends EventEmitter {
  private events: AnalyticsEvent[] = [];
  private wakeWordStats: Map<string, WakeWordStats> = new Map();
  private voiceStats: Map<string, VoiceStats> = new Map();
  private commandStats: Map<string, CommandStats> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    wakeWordLatency: [],
    synthesisTime: [],
    memoryUsage: [],
    cpuUsage: [],
    accuracyScores: [],
  };

  private maxEventsInMemory = 1000; // Keep last 1000 events
  private maxMetricSamples = 100;

  constructor() {
    super();
  }

  /**
   * Initialize analytics
   */
  async initialize(): Promise<void> {
    try {
      console.log('[Analytics] Initializing...');
      await this.loadFromStorage();
      this.emit('initialized');
    } catch (error) {
      this.emit('error', { error, context: 'Analytics initialization' });
    }
  }

  /**
   * Track wake word detection
   */
  trackWakeWordDetected(phrase: string, confidence: number): void {
    const event: AnalyticsEvent = {
      type: 'wake-word',
      timestamp: Date.now(),
      data: { phrase, confidence },
    };

    this.recordEvent(event);

    // Update stats
    if (!this.wakeWordStats.has(phrase)) {
      this.wakeWordStats.set(phrase, {
        phrase,
        detectionCount: 0,
        successRate: 0,
        avgConfidence: 0,
        lastDetected: 0,
      });
    }

    const stats = this.wakeWordStats.get(phrase)!;
    stats.detectionCount++;
    stats.avgConfidence = (stats.avgConfidence * (stats.detectionCount - 1) + confidence) / stats.detectionCount;
    stats.lastDetected = Date.now();

    this.addPerformanceMetric('accuracyScores', confidence);
  }

  /**
   * Track voice generation
   */
  trackVoiceGenerated(name: string, params: VoiceParameters): void {
    const event: AnalyticsEvent = {
      type: 'voice-generated',
      timestamp: Date.now(),
      data: { name, params },
    };

    this.recordEvent(event);

    if (!this.voiceStats.has(name)) {
      this.voiceStats.set(name, {
        name,
        usageCount: 0,
        params,
        lastUsed: 0,
        totalDuration: 0,
      });
    }

    const stats = this.voiceStats.get(name)!;
    stats.usageCount++;
    stats.lastUsed = Date.now();
  }

  /**
   * Track voice usage (speaking)
   */
  trackVoiceUsed(name: string, duration: number): void {
    const stats = this.voiceStats.get(name);
    if (stats) {
      stats.totalDuration += duration;
    }
  }

  /**
   * Track speech recognition
   */
  trackSpeechRecognized(text: string, confidence: number): void {
    const event: AnalyticsEvent = {
      type: 'speech-recognized',
      timestamp: Date.now(),
      data: { text: text.substring(0, 100), confidence },
    };

    this.recordEvent(event);
    this.addPerformanceMetric('accuracyScores', confidence);
  }

  /**
   * Track command execution
   */
  trackCommandExecuted(command: string, duration: number, success: boolean): void {
    const event: AnalyticsEvent = {
      type: 'command-executed',
      timestamp: Date.now(),
      data: { command, duration, success },
    };

    this.recordEvent(event);

    if (!this.commandStats.has(command)) {
      this.commandStats.set(command, {
        command,
        executionCount: 0,
        successRate: 0,
        avgExecutionTime: 0,
      });
    }

    const stats = this.commandStats.get(command)!;
    const oldCount = stats.executionCount;
    stats.executionCount++;
    stats.avgExecutionTime = (stats.avgExecutionTime * oldCount + duration) / stats.executionCount;

    if (success) {
      const successes = Math.round(stats.successRate * oldCount);
      stats.successRate = (successes + 1) / stats.executionCount;
    }

    this.addPerformanceMetric('synthesisTime', duration);
  }

  /**
   * Track error
   */
  trackError(error: string, context: string): void {
    const event: AnalyticsEvent = {
      type: 'error',
      timestamp: Date.now(),
      data: { error, context },
    };

    this.recordEvent(event);
    this.emit('error-tracked', { error, context });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: 'wakeWordLatency' | 'synthesisTime', value: number): void {
    const event: AnalyticsEvent = {
      type: 'performance',
      timestamp: Date.now(),
      data: { metric, value },
    };

    this.recordEvent(event);
    this.addPerformanceMetric(metric, value);
  }

  /**
   * Get wake word statistics
   */
  getWakeWordStats(): WakeWordStats[] {
    return Array.from(this.wakeWordStats.values()).sort(
      (a, b) => b.detectionCount - a.detectionCount
    );
  }

  /**
   * Get voice statistics
   */
  getVoiceStats(): VoiceStats[] {
    return Array.from(this.voiceStats.values()).sort(
      (a, b) => b.usageCount - a.usageCount
    );
  }

  /**
   * Get command statistics
   */
  getCommandStats(): CommandStats[] {
    return Array.from(this.commandStats.values()).sort(
      (a, b) => b.executionCount - a.executionCount
    );
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMetrics;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      wakeWordLatency: this.computeStats(this.performanceMetrics.wakeWordLatency),
      synthesisTime: this.computeStats(this.performanceMetrics.synthesisTime),
      accuracy: this.computeStats(this.performanceMetrics.accuracyScores),
      totalEvents: this.events.length,
    };
  }

  /**
   * Get usage trend (last N hours)
   */
  getUsageTrend(hours = 24): any {
    const now = Date.now();
    const timeWindow = hours * 60 * 60 * 1000;
    const buckets = new Map<number, number>();

    for (const event of this.events) {
      if (now - event.timestamp > timeWindow) continue;

      const bucketTime = Math.floor(event.timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);
      buckets.set(bucketTime, (buckets.get(bucketTime) || 0) + 1);
    }

    return Array.from(buckets.entries()).map(([time, count]) => ({
      time: new Date(time).toISOString(),
      eventCount: count,
    }));
  }

  /**
   * Export analytics as JSON
   */
  exportAnalytics(): any {
    return {
      exportedAt: new Date().toISOString(),
      summary: {
        totalEvents: this.events.length,
        wakeWordDetections: this.wakeWordStats.size,
        generatedVoices: this.voiceStats.size,
        executedCommands: this.commandStats.size,
      },
      wakeWords: this.getWakeWordStats(),
      voices: this.getVoiceStats(),
      commands: this.getCommandStats(),
      performance: this.getPerformanceSummary(),
      trends: this.getUsageTrend(),
    };
  }

  /**
   * Clear all analytics
   */
  clearAll(): void {
    this.events = [];
    this.wakeWordStats.clear();
    this.voiceStats.clear();
    this.commandStats.clear();
    this.performanceMetrics = {
      wakeWordLatency: [],
      synthesisTime: [],
      memoryUsage: [],
      cpuUsage: [],
      accuracyScores: [],
    };

    localStorage.removeItem('natsu-analytics');
    this.emit('analytics-cleared');
  }

  /**
   * Private: Record event
   */
  private recordEvent(event: AnalyticsEvent): void {
    this.events.push(event);

    // Keep max events in memory
    if (this.events.length > this.maxEventsInMemory) {
      this.events.shift();
    }

    // Save to storage periodically
    if (this.events.length % 50 === 0) {
      this.saveToStorage();
    }
  }

  /**
   * Private: Add performance metric
   */
  private addPerformanceMetric(key: keyof PerformanceMetrics, value: number): void {
    const metrics = this.performanceMetrics[key] as number[];
    metrics.push(value);

    if (metrics.length > this.maxMetricSamples) {
      metrics.shift();
    }
  }

  /**
   * Private: Compute statistics
   */
  private computeStats(values: number[]) {
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      samples: values.length,
    };
  }

  /**
   * Private: Save to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        wakeWords: Array.from(this.wakeWordStats.entries()),
        voices: Array.from(this.voiceStats.entries()),
        commands: Array.from(this.commandStats.entries()),
        metrics: this.performanceMetrics,
      };
      localStorage.setItem('natsu-analytics', JSON.stringify(data));
    } catch (error) {
      console.error('[Analytics] Failed to save:', error);
    }
  }

  /**
   * Private: Load from localStorage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const data = localStorage.getItem('natsu-analytics');
      if (!data) return;

      const parsed = JSON.parse(data);

      this.wakeWordStats = new Map(parsed.wakeWords || []);
      this.voiceStats = new Map(parsed.voices || []);
      this.commandStats = new Map(parsed.commands || []);
      this.performanceMetrics = parsed.metrics || this.performanceMetrics;

      console.log('[Analytics] Loaded from storage');
    } catch (error) {
      console.error('[Analytics] Failed to load:', error);
    }
  }
}

export function createAnalyticsEngine(): AnalyticsEngine {
  return new AnalyticsEngine();
}
