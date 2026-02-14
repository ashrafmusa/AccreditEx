import React, { useState, FormEvent } from "react";
import { User, Department } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useAppStore } from "../../stores/useAppStore";
import SettingsCard from "./SettingsCard";
import SettingsButton from "./SettingsButton";
import SettingsAlert from "./SettingsAlert";
import SettingsSection from "./SettingsSection";
import ImageUpload from "./ImageUpload";
import ActiveSessions from "./ActiveSessions";
import { useToast } from "../../hooks/useToast";
import { useUserStore } from "../../stores/useUserStore";
import { cloudinaryService } from "../../services/cloudinaryService";
import {
  CheckIcon,
  UserCircleIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PhotoIcon,
  CalendarDaysIcon,
} from "@/components/icons";
import {
  SettingsPanel,
  FormGroup,
  AdvancedToggle,
  EnhancedInput,
} from "./index";

// Password strength calculator
const calculatePasswordStrength = (
  password: string,
): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const strengths = [
    { score: 0, label: "", color: "" },
    { score: 1, label: "Weak", color: "text-red-600" },
    { score: 2, label: "Fair", color: "text-orange-600" },
    { score: 3, label: "Good", color: "text-yellow-600" },
    { score: 4, label: "Strong", color: "text-green-600" },
    { score: 5, label: "Very Strong", color: "text-green-700" },
  ];

  return strengths[Math.min(score, 5)];
};

const ProfileSettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { currentUser, updateUser: onUpdateUser } = useUserStore();
  const { departments } = useAppStore();

  const [name, setName] = useState(currentUser!.name);
  const [jobTitle, setJobTitle] = useState(currentUser!.jobTitle || "");
  const [hireDate, setHireDate] = useState(currentUser!.hireDate || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(currentUser!.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const userDepartment = departments.find(
    (d) => d.id === currentUser!.departmentId,
  );

  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";
  const inputClasses =
    "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent dark:focus:ring-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white transition-all";

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = t("nameRequired") || "Name is required";
    }

    if (password) {
      if (password.length < 8) {
        newErrors.password = t("passwordMinLength");
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = t("passwordsDoNotMatch");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (newName: string) => {
    setName(newName);
    if (errors.name) setErrors({ ...errors, name: "" });
    setHasChanges(
      newName !== currentUser!.name ||
        jobTitle !== (currentUser!.jobTitle || "") ||
        hireDate !== (currentUser!.hireDate || "") ||
        password !== "" ||
        avatarUrl !== (currentUser!.avatarUrl || ""),
    );
  };

  const handleJobTitleChange = (newJobTitle: string) => {
    setJobTitle(newJobTitle);
    setHasChanges(
      name !== currentUser!.name ||
        newJobTitle !== (currentUser!.jobTitle || "") ||
        hireDate !== (currentUser!.hireDate || "") ||
        password !== "" ||
        avatarUrl !== (currentUser!.avatarUrl || ""),
    );
  };

  const handleHireDateChange = (newHireDate: string) => {
    setHireDate(newHireDate);
    setHasChanges(
      name !== currentUser!.name ||
        jobTitle !== (currentUser!.jobTitle || "") ||
        newHireDate !== (currentUser!.hireDate || "") ||
        password !== "" ||
        avatarUrl !== (currentUser!.avatarUrl || ""),
    );
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    if (errors.password) setErrors({ ...errors, password: "" });
    setHasChanges(
      name !== currentUser!.name ||
        jobTitle !== (currentUser!.jobTitle || "") ||
        hireDate !== (currentUser!.hireDate || "") ||
        newPassword !== "" ||
        avatarUrl !== (currentUser!.avatarUrl || ""),
    );
  };

  const handleConfirmPasswordChange = (newConfirmPassword: string) => {
    setConfirmPassword(newConfirmPassword);
    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
  };

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t("pleaseFixErrors"));
      return;
    }

    setLoading(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // If there's a new avatar file, upload it to Cloudinary
      if (avatarFile) {
        try {
          finalAvatarUrl = await cloudinaryService.uploadImage(
            avatarFile,
            "avatars",
            (progress) => {
              console.log(`Upload progress: ${progress.progress}%`);
            },
            { forceUpload: true },
          );
        } catch (uploadError) {
          console.error("Avatar upload error:", uploadError);
          toast.error(t("avatarUploadFailed"));
          setLoading(false);
          return;
        }
      }

      // Prepare user update (filter out undefined values and password)
      const updatedUser: Partial<User> & { id: string } = {
        ...currentUser!,
        name,
        avatarUrl: finalAvatarUrl,
      };

      // Only include jobTitle and hireDate if they have values
      if (jobTitle) updatedUser.jobTitle = jobTitle;
      if (hireDate) updatedUser.hireDate = hireDate;

      // Note: Password is handled separately via Firebase Auth, not stored in Firestore
      if (password) {
        // TODO: Implement password change via Firebase Auth updatePassword()
        console.warn(
          "Password update not yet implemented - requires Firebase Auth integration",
        );
      }

      await onUpdateUser(updatedUser as User);
      setAvatarFile(undefined);
      setPassword("");
      setConfirmPassword("");
      setHasChanges(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
      toast.success(t("profileUpdated"));
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(t("settingsUpdateFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(currentUser!.name);
    setJobTitle(currentUser!.jobTitle || "");
    setHireDate(currentUser!.hireDate || "");
    setPassword("");
    setConfirmPassword("");
    setAvatarUrl(currentUser!.avatarUrl || "");
    setAvatarFile(undefined);
    setHasChanges(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
  };

  if (!currentUser) return null;

  return (
    <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-4xl">
      {hasChanges && (
        <SettingsAlert
          type="warning"
          icon={ExclamationTriangleIcon}
          title={t("unsavedChanges")}
          message={t("unsavedProfileChanges")}
          onDismiss={() => {}}
        />
      )}

      <SettingsCard
        title={t("profile")}
        description={t("profileDescription")}
        icon={UserCircleIcon}
      >
        <div className="space-y-6">
          {/* User Info Summary */}
          <div className="bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 md:p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full shrink-0">
                <UserCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {t("currentUser") || "Current User"}
                </p>
                <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 truncate">
                  {currentUser.email}
                </p>
              </div>
              <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full shrink-0">
                <CheckCircleIcon className="w-3 h-3 md:w-4 md:h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs md:text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                  {t("verified") || "Verified"}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <SettingsSection
            title={t("personalInformation") || "Personal Information"}
            description={t("personalInfoDescription")}
            icon={IdentificationIcon}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className={labelClasses}>
                    {t("userName")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`${inputClasses} ${
                      errors.name ? "border-red-500 focus:ring-red-500" : ""
                    }`}
                    placeholder={t("yourFullName") || "Your full name"}
                  />
                  {errors.name && (
                    <p className="text-red-600 dark:text-red-400 text-xs md:text-sm mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="jobTitle" className={labelClasses}>
                    <IdentificationIcon className="w-4 h-4 inline mr-2" />
                    {t("jobTitle") || "Job Title"}
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => handleJobTitleChange(e.target.value)}
                    className={inputClasses}
                    placeholder={
                      t("jobTitlePlaceholder") || "e.g., Quality Manager"
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hireDate" className={labelClasses}>
                    <CalendarDaysIcon className="w-4 h-4 inline mr-2" />
                    {t("hireDate") || "Hire Date"}
                  </label>
                  <input
                    type="date"
                    id="hireDate"
                    value={hireDate}
                    onChange={(e) => handleHireDateChange(e.target.value)}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className={labelClasses}>
                    {t("userEmail")}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={currentUser.email}
                      readOnly
                      aria-readonly="true"
                      className={`${inputClasses} bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed opacity-75 text-xs md:text-sm`}
                    />
                    <span className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded">
                      {t("readOnly")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 md:pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-3">
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">
                    {t("department") || "Department"}:
                  </span>{" "}
                  <span className="break-words">
                    {userDepartment ? userDepartment.name.en : t("unassigned")}
                  </span>
                </p>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">
                    {t("userRole") || "Role"}:
                  </span>{" "}
                  {currentUser.role}
                </p>
              </div>
            </div>
          </SettingsSection>

          {/* Profile Photo Section */}
          <SettingsSection
            title={t("profilePhoto") || "Profile Photo"}
            description={t("profilePhotoDescription")}
            icon={PhotoIcon}
          >
            <ImageUpload
              currentImage={avatarUrl}
              onImageChange={(url, file) => {
                setAvatarUrl(url);
                setAvatarFile(file);
                setHasChanges(true);
              }}
            />
          </SettingsSection>

          {/* Security Section */}
          <SettingsSection
            title={t("security") || "Security"}
            description={t("securityDescription")}
            icon={ShieldCheckIcon}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className={labelClasses}>
                  {t("newPassword") || "New Password"}
                  <span className="text-gray-400 text-xs ml-2">
                    {t("optional") || "(optional)"}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder={
                      t("passwordPlaceholder") ||
                      "Leave empty to keep current password"
                    }
                    className={`${inputClasses} ${
                      errors.password ? "border-red-500 focus:ring-red-500" : ""
                    }`}
                  />
                  {password && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
                {errors.password && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {errors.password}
                  </p>
                )}

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            calculatePasswordStrength(password).color ===
                            "text-red-600"
                              ? "bg-red-600 w-1/5"
                              : calculatePasswordStrength(password).color ===
                                  "text-orange-600"
                                ? "bg-orange-600 w-2/5"
                                : calculatePasswordStrength(password).color ===
                                    "text-yellow-600"
                                  ? "bg-yellow-600 w-3/5"
                                  : calculatePasswordStrength(password)
                                        .color === "text-green-600"
                                    ? "bg-green-600 w-4/5"
                                    : "bg-green-700 w-full"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          calculatePasswordStrength(password).color
                        }`}
                      >
                        {calculatePasswordStrength(password).label}
                      </span>
                    </div>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li
                        className={
                          password.length >= 8
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }
                      >
                        ✓ {t("atLeast8Chars")}
                      </li>
                      <li
                        className={
                          /[a-z]/.test(password) && /[A-Z]/.test(password)
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }
                      >
                        ✓ {t("mixUpperLowercase")}
                      </li>
                      <li
                        className={
                          /[0-9]/.test(password)
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }
                      >
                        ✓ {t("atLeastOneNumber")}
                      </li>
                      <li
                        className={
                          /[^a-zA-Z0-9]/.test(password)
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }
                      >
                        ✓ {t("atLeastOneSpecialChar")}
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password Field - Only show if password is entered */}
              {password && (
                <div>
                  <label htmlFor="confirmPassword" className={labelClasses}>
                    {t("confirmPassword") || "Confirm Password"}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) =>
                        handleConfirmPasswordChange(e.target.value)
                      }
                      placeholder={
                        t("confirmYourPassword") || "Confirm your password"
                      }
                      className={`${inputClasses} ${
                        errors.confirmPassword
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }`}
                    />
                    {confirmPassword && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-green-600 dark:text-green-400 text-sm mt-1 flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      {t("passwordsMatch")}
                    </p>
                  )}
                </div>
              )}

              {password && (
                <SettingsAlert
                  type="info"
                  title={t("passwordWillUpdate") || "Password will be updated"}
                  message={
                    t("passwordWillBeChanged") ||
                    "Your password will be changed when you save these changes."
                  }
                />
              )}
            </div>
          </SettingsSection>

          {/* Additional Info */}
          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 md:p-4 border border-blue-200 dark:border-blue-800/30">
            <div className="flex gap-2 md:gap-3">
              <ClockIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium">{t("tip") || "Tip"}</p>
                <p>{t("profileTip")}</p>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>

      {/* Active Sessions */}
      {currentUser?.id && <ActiveSessions userId={currentUser.id} />}

      <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-3 justify-end">
        <SettingsButton
          variant="secondary"
          onClick={handleCancel}
          disabled={!hasChanges || loading}
        >
          {t("cancel")}
        </SettingsButton>
        <SettingsButton
          variant="primary"
          type="submit"
          disabled={!hasChanges || loading}
          loading={loading}
          icon={!loading && hasChanges ? CheckIcon : undefined}
        >
          {loading ? t("saving") : t("updateProfile")}
        </SettingsButton>
      </div>
    </form>
  );
};

export default ProfileSettingsPage;
