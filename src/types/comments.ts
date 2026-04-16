/**
 * Comment System Types - AccrediTex
 * Supports inline document comments, @mentions, and threaded discussions
 */

export interface Comment {
    id: string;
    documentId: string;
    author: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    };
    content: string;
    mentions: string[]; // User IDs mentioned with @
    createdAt: Date;
    updatedAt?: Date;
    isEdited: boolean;
    isResolved: boolean;
    resolvedBy?: {
        id: string;
        name: string;
        resolvedAt: Date;
    };
    // For threaded comments
    parentCommentId?: string; // If reply, this is the parent
    replyCount: number;
    // For inline comments
    selection?: {
        startOffset: number;
        endOffset: number;
        selectedText: string; // Context for what was commented on
    };
    // Reaction support
    reactions: Record<string, string[]>; // emoji -> userIds[]
}

export interface CommentThread {
    id: string;
    documentId: string;
    rootComment: Comment;
    replies: Comment[];
    totalCount: number;
    isResolved: boolean;
    lastActivityAt: Date;
}

export interface CreateCommentRequest {
    documentId: string;
    content: string;
    mentions?: string[];
    parentCommentId?: string;
    selection?: {
        startOffset: number;
        endOffset: number;
        selectedText: string;
    };
}

export interface UpdateCommentRequest {
    commentId: string;
    content: string;
    mentions?: string[];
}
