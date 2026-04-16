/**
 * Comment Thread Component - AccrediTex
 * Displays threaded comments with replies, reactions, and @mentions
 */

import {
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  PencilIcon,
  SparklesIcon,
  TrashIcon,
} from "@/components/icons";
import { useToast } from "@/hooks/useToast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  addReaction,
  createComment,
  deleteComment,
  removeReaction,
  toggleCommentResolution,
  updateComment,
} from "@/services/commentService";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { useUserStore } from "@/stores/useUserStore";
import type { Comment, CommentThread } from "@/types/comments";
import React, { useEffect, useRef, useState } from "react";

interface CommentThreadComponentProps {
  thread: CommentThread;
  documentId: string;
  onCommentAdded?: () => void;
}

const CommentThreadComponent: React.FC<CommentThreadComponentProps> = ({
  thread,
  documentId,
  onCommentAdded,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const currentUser = useUserStore((s: any) => s.currentUser);

  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isReplying && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [isReplying]);

  const handleReply = async () => {
    if (!replyContent.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      await createComment(
        {
          documentId,
          content: replyContent.trim(),
          parentCommentId: thread.rootComment.id,
          mentions: extractMentions(replyContent),
        },
        currentUser.id,
        currentUser.firstName + " " + currentUser.lastName,
        currentUser.email,
        currentUser.avatar,
      );

      setReplyContent("");
      setIsReplying(false);
      toast.success(t("commentAdded") || "Reply added");
      onCommentAdded?.();
    } catch (error) {
      console.error("Reply error:", error);
      toast.error(t("commentError") || "Failed to add reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    try {
      await updateComment({
        commentId,
        content: editContent.trim(),
        mentions: extractMentions(editContent),
      });

      setEditingCommentId(null);
      setEditContent("");
      toast.success(t("commentUpdated") || "Comment updated");
    } catch (error) {
      console.error("Edit error:", error);
      toast.error(t("commentError") || "Failed to update comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (
      !(await useConfirmStore
        .getState()
        .confirm(
          t("confirmDeleteComment") || "Delete this comment?",
          t("deleteComment") || "Delete Comment",
          t("delete") || "Delete",
        ))
    )
      return;

    try {
      await deleteComment(commentId);
      toast.success(t("commentDeleted") || "Comment deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("commentError") || "Failed to delete comment");
    }
  };

  const handleToggleResolution = async () => {
    if (!currentUser) return;

    try {
      await toggleCommentResolution(
        thread.rootComment.id,
        currentUser.id,
        currentUser.firstName + " " + currentUser.lastName,
      );
      toast.success(
        thread.isResolved
          ? t("threadReopened") || "Thread reopened"
          : t("threadResolved") || "Thread resolved",
      );
    } catch (error) {
      console.error("Resolution error:", error);
      toast.error(t("commentError") || "Failed to update status");
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!currentUser) return;

    const comment =
      thread.rootComment.id === commentId
        ? thread.rootComment
        : thread.replies.find((r: Comment) => r.id === commentId);

    if (!comment) return;

    const hasReacted = comment.reactions[emoji]?.includes(currentUser.id);

    try {
      if (hasReacted) {
        await removeReaction(commentId, emoji, currentUser.id);
      } else {
        await addReaction(commentId, emoji, currentUser.id);
      }
    } catch (error) {
      console.error("Reaction error:", error);
      toast.error(t("commentError") || "Failed to add reaction");
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

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isEditing = editingCommentId === comment.id;
    const isAuthor = currentUser?.id === comment.author.id;

    return (
      <div
        key={comment.id}
        className={`${isReply ? "ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4" : ""} py-3`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="shrink-0 w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-semibold text-sm">
            {comment.author.avatar ? (
              <img
                src={comment.author.avatar}
                alt={comment.author.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              comment.author.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm text-brand-text-primary dark:text-dark-brand-text-primary truncate">
                  {comment.author.name}
                </span>
                <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {formatTimeAgo(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    ({t("edited") || "edited"})
                  </span>
                )}
              </div>

              {isAuthor && !isEditing && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingCommentId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="p-1 text-brand-text-secondary hover:text-brand-primary transition-colors"
                    title={t("edit") || "Edit"}
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="p-1 text-brand-text-secondary hover:text-red-600 transition-colors"
                    title={t("delete") || "Delete"}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Content or Edit Form */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
                  rows={3}
                  placeholder={t("editComment") || "Edit comment..."}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(comment.id)}
                    disabled={isSubmitting || !editContent.trim()}
                    className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("save") || "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditContent("");
                    }}
                    className="px-3 py-1.5 text-sm text-brand-text-secondary hover:text-brand-text-primary"
                  >
                    {t("cancel") || "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Selection Context */}
                {comment.selection && (
                  <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-brand-primary/30">
                    <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary italic">
                      "{comment.selection.selectedText}"
                    </p>
                  </div>
                )}

                {/* Comment Content */}
                <p className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary whitespace-pre-wrap wrap-break-word">
                  {comment.content}
                </p>

                {/* Reactions */}
                {Object.keys(comment.reactions).length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {Object.entries(comment.reactions).map(
                      ([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(comment.id, emoji)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                            userIds.includes(currentUser?.id || "")
                              ? "bg-brand-primary/20 text-brand-primary"
                              : "bg-gray-100 dark:bg-gray-700 text-brand-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{userIds.length}</span>
                        </button>
                      ),
                    )}
                    <button
                      onClick={() => handleReaction(comment.id, "👍")}
                      className="p-1 text-brand-text-secondary hover:text-brand-primary transition-colors"
                      title={t("addReaction") || "Add reaction"}
                    >
                      <SparklesIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-3 ${
        thread.isResolved
          ? "border-green-300 dark:border-green-700 bg-green-50/30 dark:bg-green-900/10"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Root Comment */}
      {renderComment(thread.rootComment)}

      {/* Replies */}
      {thread.replies.map((reply: Comment) => renderComment(reply, true))}

      {/* Reply Form */}
      {isReplying ? (
        <div className="ml-8 space-y-2 pt-2">
          <textarea
            ref={replyInputRef}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none bg-white dark:bg-gray-800 text-brand-text-primary dark:text-dark-brand-text-primary"
            rows={3}
            placeholder={t("writeReply") || "Write a reply..."}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleReply}
              disabled={isSubmitting || !replyContent.trim()}
              className="px-3 py-1.5 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? t("posting") || "Posting..."
                : t("reply") || "Reply"}
            </button>
            <button
              onClick={() => {
                setIsReplying(false);
                setReplyContent("");
              }}
              className="px-3 py-1.5 text-sm text-brand-text-secondary hover:text-brand-text-primary"
            >
              {t("cancel") || "Cancel"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsReplying(true)}
            className="flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-primary transition-colors"
          >
            <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
            {t("reply") || "Reply"}
          </button>

          <button
            onClick={handleToggleResolution}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              thread.isResolved
                ? "text-green-600 hover:text-green-700"
                : "text-brand-text-secondary hover:text-green-600"
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            {thread.isResolved
              ? t("reopenThread") || "Reopen"
              : t("resolveThread") || "Resolve"}
          </button>
        </div>
      )}
    </div>
  );
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

export default CommentThreadComponent;
