/**
 * Comments Panel - AccrediTex
 * Displays all comments for a document in a sidebar
 */

import {
  ChatBubbleLeftEllipsisIcon,
  PlusIcon,
  SpinnerIcon,
  XMarkIcon,
} from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  buildCommentThreads,
  createComment,
  subscribeToDocumentComments,
} from "@/services/commentService";
import { useUserStore } from "@/stores/useUserStore";
import type { Comment, CommentThread } from "@/types/comments";
import React, { useEffect, useRef, useState } from "react";
import CommentThreadComponent from "./CommentThread";

interface CommentsPanelProps {
  documentId: string;
  onClose?: () => void; // parent may control visibility
}

type FilterType = "all" | "unresolved" | "resolved";

const CommentsPanel: React.FC<CommentsPanelProps> = ({
  documentId,
  onClose,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const currentUser = useUserStore((s: any) => s.currentUser);

  const [comments, setComments] = useState<Comment[]>([]);
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null); // inline error message

  const newCommentRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to comments in real-time
  useEffect(() => {
    if (!documentId) return;

    const unsubscribe = subscribeToDocumentComments(
      documentId,
      (newComments: Comment[]) => {
        setComments(newComments);
        const builtThreads = buildCommentThreads(newComments);
        setThreads(builtThreads);
      },
    );

    return unsubscribe;
  }, [documentId]);

  useEffect(() => {
    if (isAddingComment && newCommentRef.current) {
      newCommentRef.current.focus();
    }
  }, [isAddingComment]);

  const handleAddComment = async () => {
    if (!newCommentContent.trim() || !currentUser) return;

    setIsSubmitting(true);
    setCommentError(null);
    try {
      await createComment(
        {
          documentId,
          content: newCommentContent.trim(),
          mentions: extractMentions(newCommentContent),
        },
        currentUser.id,
        currentUser.firstName + " " + currentUser.lastName,
        currentUser.email,
        currentUser.avatar,
      );

      setNewCommentContent("");
      setIsAddingComment(false);
      toast.success(t("commentAdded") || "Comment added");
    } catch (error) {
      console.error("Comment error:", error);
      const msg = t("commentError") || "Failed to add comment";
      setCommentError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]); // User ID
    }
    return mentions;
  };

  const filteredThreads = threads.filter((thread) => {
    if (filter === "all") return true;
    if (filter === "resolved") return thread.isResolved;
    if (filter === "unresolved") return !thread.isResolved;
    return true;
  });

  const stats = {
    total: threads.length,
    resolved: threads.filter((t) => t.isResolved).length,
    unresolved: threads.filter((t) => !t.isResolved).length,
  };

  return (
    <div
      role="complementary"
      aria-label={t("comments") || "Comments"}
      className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-brand-primary" />
          <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t("comments") || "Comments"}
          </h3>
          <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded-full text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {stats.total}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-brand-text-secondary hover:text-brand-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
          title={t("close") || "Close"}
          aria-label={t("close") || "Close comments panel"}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          onClick={() => setFilter("all")}
          aria-label={t("viewAllComments") || "View all comments"}
          className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            filter === "all"
              ? "bg-brand-primary text-white"
              : "text-brand-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {t("all") || "All"} ({stats.total})
        </button>
        <button
          onClick={() => setFilter("unresolved")}
          aria-label={t("viewOpenComments") || "View open comments"}
          className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            filter === "unresolved"
              ? "bg-brand-primary text-white"
              : "text-brand-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {t("unresolved") || "Open"} ({stats.unresolved})
        </button>
        <button
          onClick={() => setFilter("resolved")}
          aria-label={t("viewResolvedComments") || "View resolved comments"}
          className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary ${
            filter === "resolved"
              ? "bg-brand-primary text-white"
              : "text-brand-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          {t("resolved") || "Resolved"} ({stats.resolved})
        </button>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredThreads.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftEllipsisIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
              {filter === "all"
                ? t("noComments") || "No comments yet"
                : filter === "resolved"
                  ? t("noResolvedComments") || "No resolved comments"
                  : t("noUnresolvedComments") || "No open comments"}
            </p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <CommentThreadComponent
              key={thread.id}
              thread={thread}
              documentId={documentId}
            />
          ))
        )}
      </div>

      {/* New Comment Form */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        {isAddingComment ? (
          <div className="space-y-2">
            <textarea
              ref={newCommentRef}
              value={newCommentContent}
              onChange={(e) => setNewCommentContent(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none bg-white dark:bg-gray-900 text-brand-text-primary dark:text-dark-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              rows={3}
              placeholder={t("writeComment") || "Write a comment..."}
            />
            {commentError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {commentError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddComment}
                disabled={isSubmitting || !newCommentContent.trim()}
                className="flex-1 px-4 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {isSubmitting ? (
                  <SpinnerIcon className="w-4 h-4 animate-spin text-white" />
                ) : (
                  t("postComment") || "Post Comment"
                )}
              </button>
              <button
                onClick={() => {
                  setIsAddingComment(false);
                  setNewCommentContent("");
                }}
                className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              >
                {t("cancel") || "Cancel"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsAddingComment(true);
              setCommentError(null);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <PlusIcon className="w-5 h-5" />
            {t("addComment") || "Add Comment"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CommentsPanel;
