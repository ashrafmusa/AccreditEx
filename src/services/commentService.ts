/**
 * Comment Service - AccrediTex
 * Manages document comments, @mentions, and threaded discussions
 */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    increment,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type {
    Comment,
    CommentThread,
    CreateCommentRequest,
    UpdateCommentRequest,
} from '../types/comments';

const COMMENTS_COLLECTION = 'comments';

/**
 * Create a new comment
 */
export async function createComment(
    request: CreateCommentRequest,
    userId: string,
    userName: string,
    userEmail: string,
    userAvatar?: string
): Promise<Comment> {
    const commentsRef = collection(db, COMMENTS_COLLECTION);

    const commentData = {
        documentId: request.documentId,
        author: {
            id: userId,
            name: userName,
            email: userEmail,
            avatar: userAvatar || null,
        },
        content: request.content,
        mentions: request.mentions || [],
        createdAt: Timestamp.now(),
        isEdited: false,
        isResolved: false,
        parentCommentId: request.parentCommentId || null,
        replyCount: 0,
        selection: request.selection || null,
        reactions: {},
    };

    const docRef = await addDoc(commentsRef, commentData);

    // If this is a reply, increment parent's reply count
    if (request.parentCommentId) {
        const parentRef = doc(db, COMMENTS_COLLECTION, request.parentCommentId);
        await updateDoc(parentRef, {
            replyCount: increment(1),
        });
    }

    return {
        id: docRef.id,
        ...commentData,
        createdAt: new Date(),
        replyCount: 0,
        reactions: {},
    } as Comment;
}

/**
 * Update existing comment
 */
export async function updateComment(
    request: UpdateCommentRequest
): Promise<void> {
    const commentRef = doc(db, COMMENTS_COLLECTION, request.commentId);
    await updateDoc(commentRef, {
        content: request.content,
        mentions: request.mentions || [],
        updatedAt: Timestamp.now(),
        isEdited: true,
    });
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: string): Promise<void> {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentSnap = await getDocs(
        query(collection(db, COMMENTS_COLLECTION), where('__name__', '==', commentId))
    );

    if (!commentSnap.empty) {
        const comment = commentSnap.docs[0].data();

        // If has parent, decrement parent's reply count
        if (comment.parentCommentId) {
            const parentRef = doc(db, COMMENTS_COLLECTION, comment.parentCommentId);
            await updateDoc(parentRef, {
                replyCount: increment(-1),
            });
        }

        // Delete all replies first
        const repliesQuery = query(
            collection(db, COMMENTS_COLLECTION),
            where('parentCommentId', '==', commentId)
        );
        const repliesSnap = await getDocs(repliesQuery);
        await Promise.all(
            repliesSnap.docs.map((replyDoc) => deleteDoc(replyDoc.ref))
        );
    }

    await deleteDoc(commentRef);
}

/**
 * Resolve/unresolve comment thread
 */
export async function toggleCommentResolution(
    commentId: string,
    userId: string,
    userName: string
): Promise<void> {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentSnap = await getDocs(
        query(collection(db, COMMENTS_COLLECTION), where('__name__', '==', commentId))
    );

    if (!commentSnap.empty) {
        const comment = commentSnap.docs[0].data();
        const isCurrentlyResolved = comment.isResolved || false;

        await updateDoc(commentRef, {
            isResolved: !isCurrentlyResolved,
            resolvedBy: !isCurrentlyResolved
                ? {
                    id: userId,
                    name: userName,
                    resolvedAt: Timestamp.now(),
                }
                : null,
        });
    }
}

/**
 * Add reaction to comment
 */
export async function addReaction(
    commentId: string,
    emoji: string,
    userId: string
): Promise<void> {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentSnap = await getDocs(
        query(collection(db, COMMENTS_COLLECTION), where('__name__', '==', commentId))
    );

    if (!commentSnap.empty) {
        const comment = commentSnap.docs[0].data();
        const reactions = comment.reactions || {};
        const userIds = reactions[emoji] || [];

        if (!userIds.includes(userId)) {
            userIds.push(userId);
            reactions[emoji] = userIds;
            await updateDoc(commentRef, { reactions });
        }
    }
}

/**
 * Remove reaction from comment
 */
export async function removeReaction(
    commentId: string,
    emoji: string,
    userId: string
): Promise<void> {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    const commentSnap = await getDocs(
        query(collection(db, COMMENTS_COLLECTION), where('__name__', '==', commentId))
    );

    if (!commentSnap.empty) {
        const comment = commentSnap.docs[0].data();
        const reactions = comment.reactions || {};
        const userIds = reactions[emoji] || [];

        const filteredIds = userIds.filter((id: string) => id !== userId);
        if (filteredIds.length > 0) {
            reactions[emoji] = filteredIds;
        } else {
            delete reactions[emoji];
        }

        await updateDoc(commentRef, { reactions });
    }
}

/**
 * Get all comments for a document
 */
export async function getDocumentComments(
    documentId: string
): Promise<Comment[]> {
    const commentsQuery = query(
        collection(db, COMMENTS_COLLECTION),
        where('documentId', '==', documentId),
        orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(commentsQuery);
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate(),
        resolvedBy: doc.data().resolvedBy
            ? {
                ...doc.data().resolvedBy,
                resolvedAt: doc.data().resolvedBy.resolvedAt?.toDate() || new Date(),
            }
            : undefined,
    })) as Comment[];
}

/**
 * Subscribe to document comments in real-time
 */
export function subscribeToDocumentComments(
    documentId: string,
    callback: (comments: Comment[]) => void
): () => void {
    const commentsQuery = query(
        collection(db, COMMENTS_COLLECTION),
        where('documentId', '==', documentId),
        orderBy('createdAt', 'asc')
    );

    return onSnapshot(commentsQuery, (snapshot) => {
        const comments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate(),
            resolvedBy: doc.data().resolvedBy
                ? {
                    ...doc.data().resolvedBy,
                    resolvedAt: doc.data().resolvedBy.resolvedAt?.toDate() || new Date(),
                }
                : undefined,
        })) as Comment[];

        callback(comments);
    });
}

/**
 * Build comment threads from flat comment list
 */
export function buildCommentThreads(comments: Comment[]): CommentThread[] {
    const rootComments = comments.filter((c) => !c.parentCommentId);
    const commentMap = new Map(comments.map((c) => [c.id, c]));

    return rootComments.map((root) => {
        const replies = comments.filter((c) => c.parentCommentId === root.id);
        const allInThread = [root, ...replies];
        const lastActivity = Math.max(
            ...allInThread.map((c) => c.updatedAt?.getTime() || c.createdAt.getTime())
        );

        return {
            id: root.id,
            documentId: root.documentId,
            rootComment: root,
            replies,
            totalCount: 1 + replies.length,
            isResolved: root.isResolved,
            lastActivityAt: new Date(lastActivity),
        };
    });
}

/**
 * Get unresolved comment count for document
 */
export async function getUnresolvedCommentCount(
    documentId: string
): Promise<number> {
    const commentsQuery = query(
        collection(db, COMMENTS_COLLECTION),
        where('documentId', '==', documentId),
        where('isResolved', '==', false),
        where('parentCommentId', '==', null) // Only root comments
    );

    const snapshot = await getDocs(commentsQuery);
    return snapshot.size;
}
