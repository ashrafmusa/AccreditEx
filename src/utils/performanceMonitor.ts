/**
 * Performance Monitoring Utilities
 * Tracks and reports bundle size, load times, and runtime performance
 */

// Web Vitals tracking for Core Web Vitals
export interface PerformanceMetrics {
    // Load Performance
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    timeToInteractive?: number;
    speedIndex?: number;

    // Runtime Performance  
    totalBlockingTime?: number;
    cumulativeLayoutShift?: number;
    firstInputDelay?: number;
    interactionToNextPaint?: number;

    // Bundle Performance
    bundleJSSize?: number;
    bundleCSSSize?: number;
    initialChunkSize?: number;
    totalChunkCount?: number;

    // Resource Loading
    resourceCount?: number;
    totalResourceSize?: number;
    cacheHitRatio?: number;

    // Custom Metrics
    routeLoadTime?: number;
    componentMountTime?: number;
    dataFetchTime?: number;
}

// Performance observer for Core Web Vitals
class PerformanceMonitor {
    private metrics: PerformanceMetrics = {};
    private observers: PerformanceObserver[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeObservers();
        }
    }

    private initializeObservers() {
        // LCP (Largest Contentful Paint)
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1] as PerformanceEntry;
                this.metrics.largestContentfulPaint = lastEntry.startTime;
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(lcpObserver);
        } catch (e) {
            console.warn('LCP observer not supported');
        }

        // FID (First Input Delay)
        try {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry: any) => {
                    this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.push(fidObserver);
        } catch (e) {
            console.warn('FID observer not supported');
        }

        // CLS (Cumulative Layout Shift)
        try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry: any) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        this.metrics.cumulativeLayoutShift = clsValue;
                    }
                });
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(clsObserver);
        } catch (e) {
            console.warn('CLS observer not supported');
        }

        // Navigation timing
        this.measureNavigationTiming();

        // Resource timing
        this.measureResourceTiming();
    }

    private measureNavigationTiming() {
        if (typeof window !== 'undefined' && 'performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

            if (navigation) {
                // FCP approximation
                this.metrics.firstContentfulPaint = navigation.domContentLoadedEventEnd - navigation.fetchStart;

                // TTI approximation
                this.metrics.timeToInteractive = navigation.loadEventEnd - navigation.fetchStart;
            }
        }
    }

    private measureResourceTiming() {
        if (typeof window !== 'undefined' && 'performance' in window) {
            const resources = performance.getEntriesByType('resource');

            let jsSize = 0;
            let cssSize = 0;
            let totalSize = 0;
            let resourceCount = 0;

            resources.forEach((resource: any) => {
                if (resource.transferSize) {
                    totalSize += resource.transferSize;
                    resourceCount++;

                    if (resource.name.includes('.js')) {
                        jsSize += resource.transferSize;
                    } else if (resource.name.includes('.css')) {
                        cssSize += resource.transferSize;
                    }
                }
            });

            this.metrics.bundleJSSize = jsSize;
            this.metrics.bundleCSSSize = cssSize;
            this.metrics.totalResourceSize = totalSize;
            this.metrics.resourceCount = resourceCount;
        }
    }

    // Measure route load time
    measureRouteChange(routeName: string): () => void {
        const startTime = performance.now();

        return () => {
            const endTime = performance.now();
            const loadTime = endTime - startTime;

            this.metrics.routeLoadTime = loadTime;

            // Log route performance
            console.log(`🚀 Route "${routeName}" loaded in ${loadTime.toFixed(2)}ms`);

            // Track slow routes
            if (loadTime > 1000) {
                console.warn(`⚠️ Slow route detected: "${routeName}" took ${loadTime.toFixed(2)}ms`);
            }
        };
    }

    // Measure component mount time
    measureComponentMount(componentName: string): () => void {
        const startTime = performance.now();

        return () => {
            const endTime = performance.now();
            const mountTime = endTime - startTime;

            this.metrics.componentMountTime = mountTime;

            // Log component performance
            if (mountTime > 100) {
                console.warn(`⚠️ Slow component mount: "${componentName}" took ${mountTime.toFixed(2)}ms`);
            }
        };
    }

    // Get current metrics
    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    // Get performance grade
    getPerformanceGrade(): {
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
        score: number;
        issues: string[];
    } {
        const issues: string[] = [];
        let score = 100;

        // LCP should be < 2.5s
        if (this.metrics.largestContentfulPaint && this.metrics.largestContentfulPaint > 2500) {
            score -= 20;
            issues.push(`LCP too slow: ${(this.metrics.largestContentfulPaint / 1000).toFixed(1)}s (target: <2.5s)`);
        }

        // FID should be < 100ms
        if (this.metrics.firstInputDelay && this.metrics.firstInputDelay > 100) {
            score -= 15;
            issues.push(`FID too high: ${this.metrics.firstInputDelay.toFixed(0)}ms (target: <100ms)`);
        }

        // CLS should be < 0.1
        if (this.metrics.cumulativeLayoutShift && this.metrics.cumulativeLayoutShift > 0.1) {
            score -= 15;
            issues.push(`CLS too high: ${this.metrics.cumulativeLayoutShift.toFixed(3)} (target: <0.1)`);
        }

        // Bundle size should be reasonable
        if (this.metrics.bundleJSSize && this.metrics.bundleJSSize > 500 * 1024) {
            score -= 20;
            issues.push(`JS bundle too large: ${(this.metrics.bundleJSSize / 1024 / 1024).toFixed(1)}MB (target: <500KB)`);
        }

        // TTI should be < 3s
        if (this.metrics.timeToInteractive && this.metrics.timeToInteractive > 3000) {
            score -= 10;
            issues.push(`TTI too slow: ${(this.metrics.timeToInteractive / 1000).toFixed(1)}s (target: <3s)`);
        }

        let grade: 'A' | 'B' | 'C' | 'D' | 'F';
        if (score >= 90) grade = 'A';
        else if (score >= 80) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 60) grade = 'D';
        else grade = 'F';

        return { grade, score, issues };
    }

    // Generate performance report
    generateReport(): string {
        const metrics = this.getMetrics();
        const grade = this.getPerformanceGrade();

        return `
🎯 Performance Report
====================

📊 Core Web Vitals:
- LCP: ${metrics.largestContentfulPaint ? (metrics.largestContentfulPaint / 1000).toFixed(2) + 's' : 'N/A'}
- FID: ${metrics.firstInputDelay ? metrics.firstInputDelay.toFixed(0) + 'ms' : 'N/A'}  
- CLS: ${metrics.cumulativeLayoutShift ? metrics.cumulativeLayoutShift.toFixed(3) : 'N/A'}

📦 Bundle Analysis:
- JS Bundle: ${metrics.bundleJSSize ? (metrics.bundleJSSize / 1024).toFixed(0) + 'KB' : 'N/A'}
- CSS Bundle: ${metrics.bundleCSSSize ? (metrics.bundleCSSSize / 1024).toFixed(0) + 'KB' : 'N/A'}
- Total Resources: ${metrics.resourceCount || 'N/A'} files

⏱️ Load Performance:
- Time to Interactive: ${metrics.timeToInteractive ? (metrics.timeToInteractive / 1000).toFixed(2) + 's' : 'N/A'}
- Route Load Time: ${metrics.routeLoadTime ? metrics.routeLoadTime.toFixed(0) + 'ms' : 'N/A'}

🎯 Performance Grade: ${grade.grade} (${grade.score}/100)

${grade.issues.length > 0 ? '⚠️ Issues:\n' + grade.issues.map(issue => `- ${issue}`).join('\n') : '✅ No performance issues detected'}
    `.trim();
    }

    // Cleanup observers
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor() {
    return {
        measureRouteChange: performanceMonitor.measureRouteChange.bind(performanceMonitor),
        measureComponentMount: performanceMonitor.measureComponentMount.bind(performanceMonitor),
        getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
        getPerformanceGrade: performanceMonitor.getPerformanceGrade.bind(performanceMonitor),
        generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
    };
}

// Performance budget checker
export function checkPerformanceBudget(): {
    passed: boolean;
    violations: string[];
    warnings: string[];
} {
    const metrics = performanceMonitor.getMetrics();
    const violations: string[] = [];
    const warnings: string[] = [];

    // Critical violations (fail build)
    if (metrics.bundleJSSize && metrics.bundleJSSize > 1024 * 1024) { // 1MB
        violations.push(`JS bundle exceeds 1MB limit: ${(metrics.bundleJSSize / 1024 / 1024).toFixed(1)}MB`);
    }

    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 4000) { // 4s
        violations.push(`LCP exceeds 4s limit: ${(metrics.largestContentfulPaint / 1000).toFixed(1)}s`);
    }

    // Warnings (track but don't fail)
    if (metrics.bundleJSSize && metrics.bundleJSSize > 500 * 1024) { // 500KB
        warnings.push(`JS bundle approaching limit: ${(metrics.bundleJSSize / 1024).toFixed(0)}KB (target: <500KB)`);
    }

    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) { // 2.5s
        warnings.push(`LCP approaching limit: ${(metrics.largestContentfulPaint / 1000).toFixed(1)}s (target: <2.5s)`);
    }

    if (metrics.resourceCount && metrics.resourceCount > 100) {
        warnings.push(`High resource count: ${metrics.resourceCount} files (consider bundling)`);
    }

    return {
        passed: violations.length === 0,
        violations,
        warnings
    };
}

// Log performance summary on app load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const report = performanceMonitor.generateReport();
            console.log(report);

            const budget = checkPerformanceBudget();
            if (!budget.passed) {
                console.error('❌ Performance budget violations:', budget.violations);
            }
            if (budget.warnings.length > 0) {
                console.warn('⚠️ Performance warnings:', budget.warnings);
            }
        }, 1000); // Wait 1s for metrics to settle
    });
}

export default performanceMonitor;