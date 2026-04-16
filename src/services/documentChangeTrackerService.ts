/**
 * Document Change Tracker Service
 * Tracks edits, changes, and maintains audit trail for documents
 */

import { getAuth } from 'firebase/auth';

export interface DocumentEditRecord {
    id: string;
    timestamp: Date;
    userId: string;
    userEmail: string;
    userName: string;
    changeType: 'created' | 'edited' | 'approved' | 'rejected' | 'version_created' | 'restored';
    fieldChanged?: string; // e.g. 'content_en', 'status', 'metadata'
    previousValue?: string;
    newValue?: string;
    characterCount?: number; // total words/chars
    description: string; // Human-readable summary
    wordCount?: number;
    hasImages?: boolean;
    hasTables?: boolean;
}

export interface DocumentChangeHistory {
    documentId: string;
    edits: DocumentEditRecord[];
    totalEdits: number;
    lastEditAt?: Date;
    lastEditBy?: string;
    createdAt: Date;
}

/**
 * Format change size for display
 */
export function formatChangeSize(charCount?: number): string {
    if (!charCount) return '0 chars';
    if (charCount < 1000) return `${charCount} chars`;
    const words = Math.round(charCount / 5);
    return `~${words} words`;
}

/**
 * Create an edit record for a document change
 */
export function createEditRecord(
    changeType: DocumentEditRecord['changeType'],
    description: string,
    options: {
        userId?: string;
        userEmail?: string;
        userName?: string;
        fieldChanged?: string;
        previousValue?: string;
        newValue?: string;
        characterCount?: number;
        wordCount?: number;
        hasImages?: boolean;
        hasTables?: boolean;
    } = {}
): DocumentEditRecord {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    return {
        id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId: options.userId || currentUser?.uid || 'anonymous',
        userEmail: options.userEmail || currentUser?.email || 'unknown',
        userName: options.userName || currentUser?.displayName || 'Unknown User',
        changeType,
        fieldChanged: options.fieldChanged,
        previousValue: options.previousValue,
        newValue: options.newValue,
        characterCount: options.characterCount,
        wordCount: options.wordCount,
        hasImages: options.hasImages,
        hasTables: options.hasTables,
        description,
    };
}

/**
 * Track content changes by calculating diff
 */
export function detectContentChanges(
    previousContent: string,
    newContent: string
): {
    isChanged: boolean;
    changeType: 'created' | 'edited' | 'minor' | 'major';
    charDifference: number;
    percentChange: number;
} {
    // Strip HTML for character count
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');
    const prevText = stripHtml(previousContent);
    const newText = stripHtml(newContent);

    const prevLength = prevText.length;
    const newLength = newText.length;
    const charDifference = newLength - prevLength;
    const percentChange = prevLength > 0 ? (Math.abs(charDifference) / prevLength) * 100 : 100;

    if (prevLength === 0 && newLength > 0) {
        return {
            isChanged: true,
            changeType: 'created',
            charDifference,
            percentChange: 100,
        };
    }

    if (newLength === 0 && prevLength > 0) {
        return {
            isChanged: true,
            changeType: 'major',
            charDifference,
            percentChange: 100,
        };
    }

    if (prevText === newText) {
        return {
            isChanged: false,
            changeType: 'minor',
            charDifference: 0,
            percentChange: 0,
        };
    }

    // Major change: >20% content difference
    const isMajor = percentChange > 20;

    return {
        isChanged: true,
        changeType: isMajor ? 'major' : 'minor',
        charDifference,
        percentChange,
    };
}

/**
 * Generate audit trail HTML report
 */
export function generateAuditTrailReport(
    documentName: string,
    changeHistory: DocumentChangeHistory
): string {
    const sortedEdits = [...changeHistory.edits].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const changeTypeColors: Record<DocumentEditRecord['changeType'], string> = {
        'created': '#10b981',
        'edited': '#3b82f6',
        'approved': '#8b5cf6',
        'rejected': '#ef4444',
        'version_created': '#f59e0b',
        'restored': '#06b6d4',
    };

    const changeTypeLabels: Record<DocumentEditRecord['changeType'], string> = {
        'created': 'Created',
        'edited': 'Edited',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'version_created': 'Version Created',
        'restored': 'Restored',
    };

    return `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f9fafb; }
    .header { color: #1f2937; margin-bottom: 30px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; }
    .summary { background: white; padding: 20px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .summary-item { display: inline-block; margin-right: 30px; }
    .summary-label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .summary-value { font-size: 20px; font-weight: bold; color: #3b82f6; }
    .timeline { position: relative; }
    .timeline-item { 
      margin-bottom: 30px; 
      padding-left: 40px;
      position: relative;
    }
    .timeline-dot {
      position: absolute;
      left: 0;
      top: 0;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #3b82f6;
      border: 3px solid white;
      box-shadow: 0 0 0 3px #3b82f6;
    }
    .timeline-item.approved .timeline-dot { background: #8b5cf6; box-shadow: 0 0 0 3px #8b5cf6; }
    .timeline-item.rejected .timeline-dot { background: #ef4444; box-shadow: 0 0 0 3px #ef4444; }
    .timeline-item.created .timeline-dot { background: #10b981; box-shadow: 0 0 0 3px #10b981; }
    .timeline-item.version_created .timeline-dot { background: #f59e0b; box-shadow: 0 0 0 3px #f59e0b; }
    .timeline-item.restored .timeline-dot { background: #06b6d4; box-shadow: 0 0 0 3px #06b6d4; }
    .timeline-card {
      background: white;
      padding: 15px;
      border-radius: 4px;
      border-left: 4px solid #3b82f6;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .timeline-item.approved .timeline-card { border-left-color: #8b5cf6; }
    .timeline-item.rejected .timeline-card { border-left-color: #ef4444; }
    .timeline-item.created .timeline-card { border-left-color: #10b981; }
    .timeline-item.version_created .timeline-card { border-left-color: #f59e0b; }
    .timeline-item.restored .timeline-card { border-left-color: #06b6d4; }
    .timeline-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
    .timeline-type {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
      color: white;
      margin-bottom: 8px;
    }
    .timeline-type.created { background: #10b981; }
    .timeline-type.edited { background: #3b82f6; }
    .timeline-type.approved { background: #8b5cf6; }
    .timeline-type.rejected { background: #ef4444; }
    .timeline-type.version_created { background: #f59e0b; }
    .timeline-type.restored { background: #06b6d4; }
    .timeline-time { color: #6b7280; font-size: 12px; }
    .timeline-user { color: #1f2937; font-weight: 500; margin-top: 8px; }
    .timeline-email { color: #6b7280; font-size: 12px; }
    .timeline-desc { color: #4b5563; margin-top: 8px; }
    .timeline-details { 
      margin-top: 10px; 
      padding-top: 10px; 
      border-top: 1px solid #e5e7eb; 
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Document Audit Trail</h1>
    <p><strong>${documentName}</strong> — Generated ${new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()}</p>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total Changes</div>
      <div class="summary-value">${changeHistory.totalEdits}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Last Edit</div>
      <div class="summary-value">${changeHistory.lastEditAt ? new Date(changeHistory.lastEditAt).toLocaleDateString() : 'Never'}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Last Edit By</div>
      <div class="summary-value">${changeHistory.lastEditBy || 'Unknown'}</div>
    </div>
  </div>

  <div class="timeline">
    ${sortedEdits.map((edit, index) => `
      <div class="timeline-item ${edit.changeType}">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-type ${edit.changeType}">${changeTypeLabels[edit.changeType] || edit.changeType}</span>
            <span class="timeline-time">${new Date(edit.timestamp).toLocaleString()}</span>
          </div>
          <div class="timeline-user">${edit.userName}</div>
          <div class="timeline-email">${edit.userEmail}</div>
          <div class="timeline-desc">${edit.description}</div>
          ${edit.characterCount !== undefined || edit.wordCount !== undefined ? `
            <div class="timeline-details">
              ${edit.wordCount !== undefined ? `<div>Words: ${edit.wordCount}</div>` : ''}
              ${edit.characterCount !== undefined ? `<div>Characters: ${edit.characterCount}</div>` : ''}
              ${edit.hasImages ? '<div>✓ Contains images</div>' : ''}
              ${edit.hasTables ? '<div>✓ Contains tables</div>' : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;
}

/**
 * Calculate statistics from change history
 */
export function calculateChangeStatistics(changeHistory: DocumentChangeHistory) {
    const edits = changeHistory.edits;

    const byType = {
        created: edits.filter(e => e.changeType === 'created').length,
        edited: edits.filter(e => e.changeType === 'edited').length,
        approved: edits.filter(e => e.changeType === 'approved').length,
        rejected: edits.filter(e => e.changeType === 'rejected').length,
        version_created: edits.filter(e => e.changeType === 'version_created').length,
        restored: edits.filter(e => e.changeType === 'restored').length,
    };

    const byUser: Record<string, number> = {};
    edits.forEach(edit => {
        byUser[edit.userName] = (byUser[edit.userName] || 0) + 1;
    });

    const totalWords = edits.reduce((sum, e) => sum + (e.wordCount || 0), 0);
    const hasImages = edits.some(e => e.hasImages);
    const hasTables = edits.some(e => e.hasTables);

    return {
        byType,
        byUser,
        totalWords,
        hasImages,
        hasTables,
        mostActiveUser: Object.entries(byUser).sort((a, b) => b[1] - a[1])[0],
    };
}
