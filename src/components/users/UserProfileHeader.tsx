import React, { useState, useRef } from "react";
import { User, Department } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import {
  CheckCircleIcon,
  UserCircleIcon,
  PencilIcon,
  PhotoIcon,
} from "../icons";
import UserAvatar from "../common/UserAvatar";
import { cloudinaryService } from "../../services/cloudinaryService";
import { useToast } from "../../hooks/useToast";

const StatBox: React.FC<{
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex items-center gap-3">
    {icon && <div className="text-blue-600 dark:text-blue-400">{icon}</div>}
    <div>
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </dd>
    </div>
  </div>
);

interface Props {
  user: User;
  department?: Department;
  isOwnProfile?: boolean;
  onEditClick?: () => void;
  onUpdateUser?: (updatedUser: User) => void;
}

const UserProfileHeader: React.FC<Props> = ({
  user,
  department,
  isOwnProfile = false,
  onEditClick,
  onUpdateUser,
}) => {
  const { t, lang } = useTranslation();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAvatarClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !onUpdateUser) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidFileType") || "Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("fileTooLarge") || "File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const avatarUrl = await cloudinaryService.uploadImage(
        file,
        "avatars",
        (progress) => {
          // Optional: show upload progress
        },
        { forceUpload: true },
      );

      // Update user with new avatar URL
      await onUpdateUser({ ...user, avatarUrl });
      toast.success(
        t("profilePictureUpdated") || "Profile picture updated successfully",
      );
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(t("uploadFailed") || "Failed to upload profile picture");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-900 dark:to-cyan-900 rounded-lg shadow-lg overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-grid-pattern" />
      </div>

      <div className="relative p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <UserAvatar
              user={user}
              size="xl"
              showStatus
              ariaLabel={`${user.name} ${t("profilePicture")}`}
              className={isOwnProfile ? "cursor-pointer" : ""}
              onClick={isOwnProfile ? handleAvatarClick : undefined}
            />
            {isOwnProfile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label={t("uploadProfilePicture")}
                />
                {/* Upload overlay */}
                <div
                  onClick={handleAvatarClick}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  ) : (
                    <PhotoIcon className="w-8 h-8 text-white" />
                  )}
                </div>
              </>
            )}
            {isOwnProfile && onEditClick && (
              <button
                onClick={onEditClick}
                className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Edit profile"
                aria-label="Edit profile"
              >
                <PencilIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <p className="text-blue-100 font-semibold">
                {user.jobTitle || user.role}
              </p>
              {isOwnProfile && (
                <span className="px-2 py-1 bg-white/20 rounded text-blue-50 text-xs font-medium">
                  {t("yourProfile") || "Your Profile"}
                </span>
              )}
            </div>
            <p className="text-blue-50 text-sm">{user.email}</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t("active") || "Active"}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/20">
          <StatBox label={t("userEmail")} value={user.email} />
          <StatBox
            label={t("department")}
            value={department?.name[lang] || t("unassigned")}
          />
          <StatBox
            label={t("hireDate")}
            value={
              user.hireDate
                ? new Date(user.hireDate).toLocaleDateString()
                : "N/A"
            }
          />
          <StatBox label={t("role")} value={user.role} />
        </div>
      </div>
    </div>
  );
};

export default UserProfileHeader;
