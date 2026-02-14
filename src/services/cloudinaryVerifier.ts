/**
 * Cloudinary Configuration Verifier
 * Run this utility to verify Cloudinary setup is complete and working
 * 
 * Usage: Import and call verifyCloudinarySetup() during development
 */

import { cloudinaryService } from './cloudinaryService';

export interface CloudinaryVerificationResult {
    overall: 'pass' | 'fail' | 'partial';
    checks: {
        name: string;
        status: 'pass' | 'fail' | 'warn';
        message: string;
    }[];
}

/**
 * Verify Cloudinary configuration is complete and valid
 */
export async function verifyCloudinarySetup(): Promise<CloudinaryVerificationResult> {
    const checks: CloudinaryVerificationResult['checks'] = [];

    // 1. Check environment variables
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    checks.push({
        name: 'VITE_CLOUDINARY_CLOUD_NAME',
        status: cloudName && cloudName !== 'demo' ? 'pass' : 'fail',
        message: cloudName
            ? `Set to "${cloudName}"`
            : 'Missing — add VITE_CLOUDINARY_CLOUD_NAME to .env file',
    });

    checks.push({
        name: 'VITE_CLOUDINARY_UPLOAD_PRESET',
        status: uploadPreset && uploadPreset !== 'ml_default' ? 'pass' : 'fail',
        message: uploadPreset
            ? `Set to "${uploadPreset}"`
            : 'Missing — add VITE_CLOUDINARY_UPLOAD_PRESET to .env file',
    });

    // 2. Check service initialization
    const configInfo = cloudinaryService.getConfigInfo();
    checks.push({
        name: 'Service Initialized',
        status: configInfo.configured ? 'pass' : 'fail',
        message: configInfo.configured
            ? `Cloud: ${configInfo.cloudName}, Preset: ${configInfo.uploadPreset}`
            : 'Service not properly configured — check .env values',
    });

    // 3. Check @cloudinary/url-gen package is available
    try {
        const { Cloudinary } = await import('@cloudinary/url-gen');
        checks.push({
            name: '@cloudinary/url-gen Package',
            status: Cloudinary ? 'pass' : 'fail',
            message: Cloudinary ? 'Package loaded successfully' : 'Package import failed',
        });
    } catch {
        checks.push({
            name: '@cloudinary/url-gen Package',
            status: 'fail',
            message: 'Package not installed — run: npm install @cloudinary/url-gen',
        });
    }

    // 4. Check CSP allows Cloudinary domains
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
        const cspContent = cspMeta.getAttribute('content') || '';
        const hasImgSrc = cspContent.includes('cloudinary.com') && cspContent.includes('img-src');
        const hasConnectSrc = cspContent.includes('api.cloudinary.com') && cspContent.includes('connect-src');

        checks.push({
            name: 'CSP img-src (cloudinary.com)',
            status: hasImgSrc ? 'pass' : 'fail',
            message: hasImgSrc
                ? 'CSP allows Cloudinary image sources'
                : 'Missing *.cloudinary.com in img-src CSP directive',
        });

        checks.push({
            name: 'CSP connect-src (api.cloudinary.com)',
            status: hasConnectSrc ? 'pass' : 'fail',
            message: hasConnectSrc
                ? 'CSP allows Cloudinary API connections'
                : 'Missing api.cloudinary.com in connect-src CSP directive',
        });
    } else {
        checks.push({
            name: 'Content Security Policy',
            status: 'warn',
            message: 'No CSP meta tag found — Cloudinary should work but consider adding CSP',
        });
    }

    // 5. Connectivity check (lightweight — HEAD request to cloud endpoint)
    if (configInfo.configured) {
        try {
            const testUrl = `https://res.cloudinary.com/${configInfo.cloudName}/image/upload/sample.jpg`;
            const response = await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
            checks.push({
                name: 'Cloud Connectivity',
                status: 'pass',
                message: `Successfully reached res.cloudinary.com/${configInfo.cloudName}`,
            });
        } catch (error) {
            checks.push({
                name: 'Cloud Connectivity',
                status: 'warn',
                message: 'Could not reach Cloudinary — check network or cloud name',
            });
        }
    }

    // 6. Check queue status
    const queueStatus = cloudinaryService.getQueueStatus();
    checks.push({
        name: 'Upload Queue',
        status: queueStatus.isOnline ? 'pass' : 'warn',
        message: queueStatus.isOnline
            ? `Online | Pending: ${queueStatus.pending} | Active: ${queueStatus.active} | Offline queue: ${queueStatus.offline}`
            : `OFFLINE | ${queueStatus.offline} uploads queued for when connection restores`,
    });

    // Determine overall status
    const hasFailures = checks.some(c => c.status === 'fail');
    const hasWarnings = checks.some(c => c.status === 'warn');
    const overall = hasFailures ? 'fail' : hasWarnings ? 'partial' : 'pass';

    const result: CloudinaryVerificationResult = { overall, checks };

    // Log results to console in a readable format
    console.group(`☁️ Cloudinary Configuration Verification: ${overall.toUpperCase()}`);
    checks.forEach(check => {
        const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
        console.log(`${icon} ${check.name}: ${check.message}`);
    });
    console.groupEnd();

    return result;
}

/**
 * Quick check — returns true if Cloudinary is ready for uploads
 */
export function isCloudinaryReady(): boolean {
    return cloudinaryService.isConfigured();
}
