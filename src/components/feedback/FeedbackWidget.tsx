/**
 * Feedback Widget Component
 * Allows users to report bugs, suggest features, and rate their experience
 * Stores feedback in Firestore for review
 */

import React, { useState } from "react";
import {
  ChatBubbleLeftEllipsisIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  StarIcon,
} from "@/components/icons";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { useUserStore } from "@/stores/useUserStore";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/services/logger";
import { cloudinaryService } from "@/services/cloudinaryService";

type FeedbackType = "bug" | "feature" | "rating";

export const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("bug");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeErrors, setIncludeErrors] = useState(true);

  const { currentUser } = useUserStore();
  const toast = useToast();

  const handleSubmit = async () => {
    if (!message.trim() && type !== "rating") {
      toast.warning("Please enter your feedback");
      return;
    }

    if (type === "rating" && rating === 0) {
      toast.warning("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload full error logs to Cloudinary if available
      let errorLogsUrl = null;
      if (includeErrors && type === "bug") {
        try {
          const fullErrors = (logger as any).exportErrors();
          // Only upload if there are actual errors
          if (fullErrors && fullErrors.length > 50) {
            const filename = `feedback-errors-${
              currentUser?.id || "anon"
            }-${Date.now()}.json`;
            errorLogsUrl = await cloudinaryService.uploadTextFile(
              fullErrors,
              filename,
              "feedback-logs",
            );
            console.log("Error logs uploaded to Cloudinary:", errorLogsUrl);
          }
        } catch (err) {
          console.warn("Failed to upload error logs, skipping:", err);
          // Continue without error logs
        }
      }

      const feedbackData = {
        type,
        rating: type === "rating" ? rating : null,
        message: message.trim().substring(0, 1000), // Increased limit since we're using Cloudinary for logs
        userId: currentUser?.id || "anonymous",
        userName: currentUser?.name || "Anonymous",
        userEmail: currentUser?.email || null,
        userRole: currentUser?.role || "Unknown",
        url: window.location.pathname,
        timestamp: serverTimestamp(),
        errorLogsUrl: errorLogsUrl, // Cloudinary URL instead of inline data
        appVersion: "1.0.0-beta",
      };

      await addDoc(collection(db, "feedback"), feedbackData);

      toast.success("Thank you for your feedback!");

      // Reset form
      setMessage("");
      setRating(0);
      setIsOpen(false);

      // Clear errors after successful submission
      if (includeErrors) {
        (logger as any).clearErrors();
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to submit feedback: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:right-6 z-[9998] bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110"
        aria-label="Send Feedback"
        title="Send Feedback"
      >
        <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 md:right-6 z-[9998] w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-xl">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
          Send Feedback
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded-lg transition-colors"
          aria-label="Close"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Type Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setType("bug")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              type === "bug"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500"
                : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-2 border-transparent"
            }`}
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            Bug
          </button>
          <button
            onClick={() => setType("feature")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              type === "feature"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-2 border-blue-500"
                : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-2 border-transparent"
            }`}
          >
            <LightBulbIcon className="w-4 h-4" />
            Idea
          </button>
          <button
            onClick={() => setType("rating")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              type === "rating"
                ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-2 border-yellow-500"
                : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-2 border-transparent"
            }`}
          >
            <StarIcon className="w-4 h-4" />
            Rate
          </button>
        </div>

        {/* Rating Stars (only for rating type) */}
        {type === "rating" && (
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                {star <= rating ? (
                  <StarIcon className="w-8 h-8 text-yellow-400" />
                ) : (
                  <StarIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Message */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            type === "bug"
              ? "Describe the bug you encountered..."
              : type === "feature"
                ? "Share your idea or suggestion..."
                : "Tell us about your experience..."
          }
          className="w-full h-32 p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
          maxLength={1000}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
          {message.length}/1000
        </p>

        {/* Include Errors Checkbox */}
        {type === "bug" && (
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={includeErrors}
              onChange={(e) => setIncludeErrors(e.target.checked)}
              className="rounded border-gray-300 dark:border-slate-600 text-green-600 focus:ring-green-500"
            />
            Include error logs (helps us fix bugs faster)
          </label>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Feedback"}
        </button>
      </div>
    </div>
  );
};
