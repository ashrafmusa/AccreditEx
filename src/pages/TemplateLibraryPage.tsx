import {
  LibraryTemplate,
  TEMPLATE_CATEGORY_COLORS,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_PROGRAM_COLORS,
  TEMPLATE_PROGRAM_LABELS,
  TemplateCategory,
  TemplateProgram,
  getTemplatesByCategory,
  searchLibraryTemplates,
  templateLibrary,
} from "@/data/templateLibrary";
import { useTranslation } from "@/hooks/useTranslation";
import { NavigationState } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useState } from "react";

// ── Icons (inline SVG to avoid extra icon imports) ──────────────────────────

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);
const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18 18 6M6 6l12 12"
    />
  </svg>
);
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.5}
    className="w-3.5 h-3.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
    />
  </svg>
);
const FileTextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
    />
  </svg>
);
const CheckCircleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);
const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
    />
  </svg>
);
const FolderOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
    />
  </svg>
);
const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
    />
  </svg>
);
const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
    />
  </svg>
);
const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.5}
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
  </svg>
);

// ── Types ────────────────────────────────────────────────────────────────────

type SortOption = "popular" | "newest" | "az";

interface TemplateLibraryPageProps {
  setNavigation: (state: NavigationState) => void;
}

// ── Interactive Star Rating ───────────────────────────────────────────────────

const StarRating: React.FC<{
  rating: number;
  userRating?: number;
  onRate?: (star: number) => void;
  size?: "sm" | "md";
}> = ({ rating, userRating, onRate, size = "sm" }) => {
  const [hovered, setHovered] = useState(0);
  const displayRating = userRating ?? Math.round(rating);
  const activeRating = hovered || displayRating;
  const cls = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          onMouseEnter={() => onRate && setHovered(star)}
          onMouseLeave={() => onRate && setHovered(0)}
          className={`${onRate ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform text-amber-400`}
          aria-label={`Rate ${star} stars`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={star <= activeRating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={star <= activeRating ? 0 : 1.5}
            className={cls}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
        </button>
      ))}
      {userRating ? (
        <span className="text-xs text-brand-primary font-semibold ml-1">
          ★ Rated
        </span>
      ) : (
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// ── Preview Modal ────────────────────────────────────────────────────────────

const PreviewModal: React.FC<{
  template: LibraryTemplate;
  isFavorite: boolean;
  userRating?: number;
  onClose: () => void;
  onUseTemplate: (template: LibraryTemplate) => void;
  onToggleFavorite: (id: string) => void;
  onRate: (id: string, star: number) => void;
}> = ({
  template,
  isFavorite,
  userRating,
  onClose,
  onUseTemplate,
  onToggleFavorite,
  onRate,
}) => {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1 pr-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${TEMPLATE_CATEGORY_COLORS[template.category]}`}
                >
                  {TEMPLATE_CATEGORY_LABELS[template.category]}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${TEMPLATE_PROGRAM_COLORS[template.program]}`}
                >
                  {TEMPLATE_PROGRAM_LABELS[template.program]}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {template.name}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(template.id)}
                className={`p-2 rounded-lg transition-colors ${isFavorite ? "text-red-500 bg-red-50 dark:bg-red-900/20" : "text-gray-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"}`}
                aria-label={
                  isFavorite ? "Remove from favorites" : "Add to favorites"
                }
              >
                <HeartIcon filled={isFavorite} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <XIcon />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {t("templateDescription")}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {template.description}
              </p>
            </div>

            {/* Structure */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t("templateStructure")} · {template.sections.length}{" "}
                {t("templateSections").replace(
                  "{count}",
                  String(template.sections.length),
                )}
              </h3>
              <ol className="space-y-1.5">
                {template.sections.map((section, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                      {idx + 1}
                    </span>
                    {section}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tags */}
            {template.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t("templateTags")}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-6 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <UsersIcon />
                <span>
                  {template.usageCount.toLocaleString()}{" "}
                  {t("templateUsedCount").replace("{count}", "")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {userRating ? "Your rating" : "Tap to rate"}
                </span>
                <StarRating
                  rating={template.rating}
                  userRating={userRating}
                  onRate={(star) => onRate(template.id, star)}
                  size="md"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t("closePreview")}
            </button>
            <button
              onClick={() => {
                onUseTemplate(template);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircleIcon />
              {t("useThisTemplate")}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Template Card ────────────────────────────────────────────────────────────

const TemplateCard: React.FC<{
  template: LibraryTemplate;
  isFavorite: boolean;
  userRating?: number;
  onPreview: (template: LibraryTemplate) => void;
  onUse: (template: LibraryTemplate) => void;
  onToggleFavorite: (id: string) => void;
  onRate: (id: string, star: number) => void;
}> = ({
  template,
  isFavorite,
  userRating,
  onPreview,
  onUse,
  onToggleFavorite,
  onRate,
}) => {
  const { t } = useTranslation();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3 hover:shadow-lg hover:border-brand-primary/30 dark:hover:border-brand-primary/40 transition-all duration-200"
    >
      {/* Favorite + Featured */}
      <div className="absolute top-3 ltr:right-3 rtl:left-3 flex items-center gap-1">
        {template.isFeatured && (
          <span className="text-brand-primary">
            <SparklesIcon />
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(template.id);
          }}
          className={`p-1 rounded-lg transition-colors ${isFavorite ? "text-red-500" : "text-gray-300 dark:text-gray-600 hover:text-red-400"}`}
          aria-label={
            isFavorite ? "Remove from favorites" : "Save to favorites"
          }
        >
          <HeartIcon filled={isFavorite} />
        </button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 pr-16">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${TEMPLATE_CATEGORY_COLORS[template.category]}`}
        >
          {TEMPLATE_CATEGORY_LABELS[template.category]}
        </span>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${TEMPLATE_PROGRAM_COLORS[template.program]}`}
        >
          {TEMPLATE_PROGRAM_LABELS[template.program]}
        </span>
      </div>

      {/* Name + Description */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-1 group-hover:text-brand-primary transition-colors">
          {template.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Meta: sections + rating */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <FileTextIcon />
          <span>{template.sections.length} sections</span>
        </div>
        <StarRating
          rating={template.rating}
          userRating={userRating}
          onRate={(star) => onRate(template.id, star)}
        />
      </div>

      {/* Action buttons (shown on hover) */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onPreview(template)}
          className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {t("previewTemplate")}
        </button>
        <button
          onClick={() => onUse(template)}
          className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors font-medium flex items-center justify-center gap-1"
        >
          {t("useTemplate")}
          <ArrowRightIcon />
        </button>
      </div>
    </motion.div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────

const TemplateLibraryPage: React.FC<TemplateLibraryPageProps> = ({
  setNavigation,
}) => {
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    TemplateCategory | "all"
  >("all");
  const [selectedProgram, setSelectedProgram] = useState<
    TemplateProgram | "all"
  >("all");
  const [sortOption, setSortOption] = useState<SortOption>("popular");
  const [previewTemplate, setPreviewTemplate] =
    useState<LibraryTemplate | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ── Favorites — persisted to localStorage ────────────────────────────────
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("templateFavorites");
      return saved ? new Set<string>(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem("templateFavorites", JSON.stringify([...next]));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // ── User ratings — optimistic UI ─────────────────────────────────────────
  const [userRatings, setUserRatings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("templateRatings");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleRate = useCallback((id: string, star: number) => {
    setUserRatings((prev) => {
      const next = { ...prev, [id]: star };
      try {
        localStorage.setItem("templateRatings", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalUsage = templateLibrary.reduce(
      (sum, t) => sum + t.usageCount,
      0,
    );
    const avgRating = (
      templateLibrary.reduce((sum, t) => sum + t.rating, 0) /
      templateLibrary.length
    ).toFixed(1);
    return { totalUsage, avgRating };
  }, []);

  // ── Filtered + Sorted Templates ───────────────────────────────────────────

  const filteredTemplates = useMemo(() => {
    let results = templateLibrary;

    if (searchQuery) {
      results = searchLibraryTemplates(searchQuery);
    }
    if (showFavoritesOnly) {
      results = results.filter((t) => favorites.has(t.id));
    }
    if (selectedCategory !== "all") {
      results = results.filter((t) => t.category === selectedCategory);
    }
    if (selectedProgram !== "all") {
      results = results.filter((t) => t.program === selectedProgram);
    }

    switch (sortOption) {
      case "popular":
        return [...results].sort((a, b) => b.usageCount - a.usageCount);
      case "az":
        return [...results].sort((a, b) => a.name.localeCompare(b.name));
      case "newest":
      default:
        return results;
    }
  }, [
    searchQuery,
    selectedCategory,
    selectedProgram,
    sortOption,
    showFavoritesOnly,
    favorites,
  ]);

  // ── Category counts ────────────────────────────────────────────────────────

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templateLibrary.length };
    for (const cat of Object.keys(
      TEMPLATE_CATEGORY_LABELS,
    ) as TemplateCategory[]) {
      counts[cat] = getTemplatesByCategory(cat).length;
    }
    return counts;
  }, []);

  // ── "Use Template" handler ─────────────────────────────────────────────────

  const handleUseTemplate = (template: LibraryTemplate) => {
    logTemplateUsage({ templateId: template.id });
    if (
      template.category === "policy" ||
      template.category === "sop" ||
      template.category === "form" ||
      template.category === "checklist" ||
      template.category === "training"
    ) {
      setNavigation({ view: "documentControl", templateId: template.id });
    } else {
      setNavigation({ view: "projects", templateId: template.id });
    }
  };

  // ── Category sidebar items ─────────────────────────────────────────────────

  const sidebarCategories: Array<{
    id: TemplateCategory | "all";
    label: string;
  }> = [
    { id: "all", label: t("allCategories") },
    ...Object.entries(TEMPLATE_CATEGORY_LABELS).map(([id, label]) => ({
      id: id as TemplateCategory,
      label,
    })),
  ];

  const programs: Array<TemplateProgram | "all"> = [
    "all",
    "JCI",
    "CBAHI",
    "DNV",
    "CAP",
    "ISO9001",
    "NABH",
    "General",
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {t("templateLibrary")}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t("templateLibraryDescription")}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: t("totalTemplates"),
                value: templateLibrary.length.toString(),
                icon: <FileTextIcon />,
                color: "text-brand-primary",
                bg: "bg-brand-primary/10",
              },
              {
                label: t("templateCategories"),
                value: String(Object.keys(TEMPLATE_CATEGORY_LABELS).length),
                icon: <FolderOpenIcon />,
                color: "text-green-600 dark:text-green-400",
                bg: "bg-green-100 dark:bg-green-900/20",
              },
              {
                label: t("accreditationPrograms"),
                value: String(Object.keys(TEMPLATE_PROGRAM_LABELS).length - 1), // exclude General
                icon: <CheckCircleIcon />,
                color: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-100 dark:bg-blue-900/20",
              },
              {
                label: t("communityRated"),
                value: stats.avgRating,
                icon: <SparklesIcon />,
                color: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-100 dark:bg-amber-900/20",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 flex items-center gap-3"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}
                >
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="lg:w-56 flex-shrink-0 space-y-6">
            {/* Search */}
            <div className="relative">
              <span className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder={t("searchTemplates")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-8 rtl:pl-8 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <XIcon />
                </button>
              )}
            </div>

            {/* Favorites toggle */}
            <button
              onClick={() => setShowFavoritesOnly((v) => !v)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                showFavoritesOnly
                  ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <HeartIcon filled={showFavoritesOnly} />
              My Favorites
              <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full px-1.5 py-0.5">
                {favorites.size}
              </span>
            </button>

            {/* Category Filter */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
                {t("filterByCategory")}
              </p>
              <div className="space-y-0.5">
                {sidebarCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-brand-primary text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`text-xs ${selectedCategory === cat.id ? "text-white/70" : "text-gray-400"}`}
                    >
                      {categoryCounts[cat.id] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Program Filter */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
                {t("filterByProgram")}
              </p>
              <div className="flex flex-col gap-0.5">
                {programs.map((prog) => (
                  <button
                    key={prog}
                    onClick={() => setSelectedProgram(prog)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedProgram === prog
                        ? "bg-brand-primary text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {prog === "all"
                      ? t("allPrograms")
                      : TEMPLATE_PROGRAM_LABELS[prog]}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Template Grid ────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {filteredTemplates.length}
                </span>{" "}
                templates
                {(selectedCategory !== "all" ||
                  selectedProgram !== "all" ||
                  searchQuery ||
                  showFavoritesOnly) && (
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedProgram("all");
                      setSearchQuery("");
                      setShowFavoritesOnly(false);
                    }}
                    className="ml-2 text-brand-primary hover:underline text-xs"
                  >
                    {t("clearFilters")}
                  </button>
                )}
              </p>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="popular">{t("sortPopular")}</option>
                <option value="newest">{t("sortNewest")}</option>
                <option value="az">{t("sortAlphabetical")}</option>
              </select>
            </div>

            {/* Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-400">
                  <FileTextIcon />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {t("noTemplatesFound")}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t("noTemplatesFoundDescription")}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedProgram("all");
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm hover:bg-brand-primary/90 transition-colors"
                >
                  {t("clearFilters")}
                </button>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isFavorite={favorites.has(template.id)}
                      userRating={userRatings[template.id]}
                      onPreview={setPreviewTemplate}
                      onUse={handleUseTemplate}
                      onToggleFavorite={toggleFavorite}
                      onRate={handleRate}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Preview Modal ──────────────────────────────────────────────────── */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          isFavorite={favorites.has(previewTemplate.id)}
          userRating={userRatings[previewTemplate.id]}
          onClose={() => setPreviewTemplate(null)}
          onUseTemplate={handleUseTemplate}
          onToggleFavorite={toggleFavorite}
          onRate={handleRate}
        />
      )}
    </div>
  );
};

export default TemplateLibraryPage;
