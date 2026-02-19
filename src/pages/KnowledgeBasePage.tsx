import React, { useMemo, useState, useCallback } from "react";
import { useUserStore } from "@/stores/useUserStore";
import {
  KBArticle,
  KBArticleCategory,
  KB_CATEGORY_LABELS,
  UserRole,
} from "@/types";
import { Button, EmptyState, Input } from "@/components/ui";
import { PlusIcon, SearchIcon, BookOpenIcon } from "@/components/icons";

// ── Seed Articles ──

const SEED_ARTICLES: KBArticle[] = [
  {
    id: "kb-1",
    title: "Hand Hygiene — WHO 5 Moments Framework",
    category: "best_practice",
    summary:
      "Comprehensive guide to implementing the WHO 5 Moments for Hand Hygiene in healthcare settings, including monitoring strategies and improvement tools.",
    content: `## Overview\nThe WHO 5 Moments for Hand Hygiene is the globally accepted framework for hand hygiene compliance in healthcare. The 5 moments are:\n\n1. **Before touching a patient**\n2. **Before a clean/aseptic procedure**\n3. **After body fluid exposure risk**\n4. **After touching a patient**\n5. **After touching patient surroundings**\n\n## Implementation Tips\n- Place alcohol-based hand rub dispensers at point of care\n- Conduct regular direct observation audits (target ≥80% compliance)\n- Use the WHO Hand Hygiene Self-Assessment Framework annually\n- Celebrate World Hand Hygiene Day (May 5) to reinforce culture\n\n## Related Standards\n- JCI PCI.5 / CBAHI IC-03\n- WHO Guidelines on Hand Hygiene in Health Care (2009)`,
    tags: ["infection control", "hand hygiene", "WHO", "PCI"],
    author: "System",
    authorId: "system",
    relatedStandardIds: ["PCI.5"],
    publishedAt: "2026-01-15",
    updatedAt: "2026-01-15",
    viewCount: 42,
    helpful: 18,
    isPinned: true,
  },
  {
    id: "kb-2",
    title: "Medication Reconciliation at Transitions of Care",
    category: "clinical_protocol",
    summary:
      "Step-by-step protocol for conducting medication reconciliation at admission, transfer, and discharge to prevent adverse drug events.",
    content: `## Purpose\nMedication reconciliation reduces adverse drug events by ensuring an accurate and complete medication list at every transition of care.\n\n## Process\n1. **Admission:** Obtain Best Possible Medication History (BPMH) from patient + 2 sources\n2. **Transfer:** Compare current orders with BPMH — resolve discrepancies\n3. **Discharge:** Reconcile all medications, provide patient-friendly list\n\n## Key Requirements\n- High-alert medications require independent double-check\n- Document reconciliation in the medical record\n- Patient/family education on changes\n\n## Related Standards\n- JCI IPSG.3 / MMU.4 / CBAHI MM-05`,
    tags: ["medication safety", "reconciliation", "IPSG.3", "transitions"],
    author: "System",
    authorId: "system",
    relatedStandardIds: ["IPSG.3", "MMU.4"],
    publishedAt: "2026-01-20",
    updatedAt: "2026-01-20",
    viewCount: 35,
    helpful: 12,
  },
  {
    id: "kb-3",
    title: "CBAHI 2025 — Key Changes Summary",
    category: "regulatory_update",
    summary:
      "Summary of the major revisions in the CBAHI 2025 standards update, including new patient safety requirements and governance expectations.",
    content: `## What Changed\nCBAHI released updated standards in 2025 with significant revisions to:\n\n### Patient Safety\n- Strengthened fall prevention requirements (new risk tools)\n- Enhanced surgical safety checklist compliance monitoring\n\n### Governance\n- Board oversight of quality metrics now mandatory quarterly\n- New requirement for public reporting of selected quality indicators\n\n### Staff Qualifications\n- Expanded privileging requirements for advanced practice roles\n- Mandatory simulation-based competency assessment for high-risk procedures\n\n## Action Items\n1. Gap analysis against new standards\n2. Update policies by Q2 2025\n3. Staff training on revised requirements`,
    tags: ["CBAHI", "regulatory", "2025 update", "standards"],
    author: "System",
    authorId: "system",
    publishedAt: "2025-12-01",
    updatedAt: "2026-01-10",
    viewCount: 67,
    helpful: 31,
    isPinned: true,
  },
  {
    id: "kb-4",
    title: "Root Cause Analysis — Best Practice Guide",
    category: "how_to",
    summary:
      "How to conduct an effective root cause analysis using fishbone diagrams and the 5-Why technique, with healthcare-specific examples.",
    content: `## When to Perform RCA\n- Sentinel events\n- Serious safety events (SSE)\n- Recurring near-miss patterns\n- Significant process failures\n\n## Fishbone Diagram (Ishikawa)\nOrganize causes into 6M categories:\n- **Manpower** (staffing, training, fatigue)\n- **Methods** (procedures, protocols, guidelines)\n- **Materials** (supplies, medications, equipment)\n- **Machines** (equipment failure, software)\n- **Measurement** (monitoring, data accuracy)\n- **Mother Nature** (environment, facility conditions)\n\n## 5-Why Technique\nAsk "Why?" iteratively (typically 3-5 times) until you reach the systemic root cause.\n\n## Tips\n- Include frontline staff in the analysis team\n- Focus on systems, not individuals\n- Identify at least 2 corrective actions per root cause\n- Set measurable effectiveness indicators`,
    tags: ["RCA", "root cause", "fishbone", "5-why", "quality"],
    author: "System",
    authorId: "system",
    publishedAt: "2026-02-01",
    updatedAt: "2026-02-01",
    viewCount: 28,
    helpful: 15,
  },
  {
    id: "kb-5",
    title: "Safe Surgery Checklist — Implementation Guide",
    category: "safety_alert",
    summary:
      "Implementation guide for the WHO Surgical Safety Checklist with adaptations for accreditation requirements.",
    content: `## The 3 Phases\n\n### Sign In (Before Anesthesia)\n- Patient identity confirmed\n- Procedure and site marked\n- Consent verified\n- Anesthesia safety check completed\n- Pulse oximeter functioning\n\n### Time Out (Before Incision)\n- All team members introduced by name and role\n- Surgeon, anesthesiologist, nurse confirm: patient, site, procedure\n- Anticipated critical events reviewed\n- Antibiotic prophylaxis given within 60 min\n- Essential imaging displayed\n\n### Sign Out (Before Patient Leaves OR)\n- Procedure name confirmed as recorded\n- Instrument and sponge counts complete\n- Specimen labeled\n- Equipment problems addressed\n- Recovery plan communicated\n\n## Compliance Monitoring\n- Direct observation audits monthly\n- Target: 100% completion rate`,
    tags: ["surgical safety", "checklist", "WHO", "patient safety"],
    author: "System",
    authorId: "system",
    relatedStandardIds: ["IPSG.4"],
    publishedAt: "2026-01-25",
    updatedAt: "2026-01-25",
    viewCount: 51,
    helpful: 22,
  },
  {
    id: "kb-6",
    title: "CAP Laboratory Competency — 6 Elements Explained",
    category: "policy_guidance",
    summary:
      "Detailed explanation of the CAP 6 elements of competency assessment required for laboratory personnel, with practical examples.",
    content: `## CAP 6 Elements of Competency\n\nAll testing personnel must be assessed on all 6 elements annually:\n\n1. **Direct Observation of Routine Patient Test Performance** — Watch the technologist perform actual patient testing\n2. **Monitoring the Recording and Reporting of Test Results** — Review worksheets, LIS entries, and result reporting accuracy\n3. **Review of Intermediate Test Results / Worksheets** — Examine QC data, calibration records, maintenance logs\n4. **Direct Observation of Instrument Maintenance and Function Checks** — Observe PM procedures\n5. **Assessment of Test Performance Through Testing Previously Analyzed Specimens** — Blind proficiency or split samples\n6. **Assessment of Problem-Solving Skills** — Present troubleshooting scenarios\n\n## Documentation Requirements\n- Use standardized assessment forms per discipline\n- Document within 12 months of hire, then annually\n- Maintain records for 2 years minimum`,
    tags: ["CAP", "laboratory", "competency", "6 elements"],
    author: "System",
    authorId: "system",
    publishedAt: "2026-02-05",
    updatedAt: "2026-02-05",
    viewCount: 19,
    helpful: 8,
  },
  {
    id: "kb-7",
    title: "Patient Identification — Two-Identifier Policy FAQ",
    category: "faq",
    summary:
      "Frequently asked questions about implementing the two-identifier patient identification policy per IPSG.1 requirements.",
    content: `## Q: What counts as a patient identifier?\nA: Name, date of birth, medical record number, or government ID number. **Room number is NOT an acceptable identifier.**\n\n## Q: When must two identifiers be verified?\nA: Before every:\n- Medication administration\n- Blood/specimen collection\n- Blood product transfusion\n- Treatment or procedure\n- Providing meals (for dietary restrictions)\n\n## Q: What about emergency situations?\nA: Use a temporary identifier (e.g., "Unknown Male + timestamp") and reconcile ASAP. Document the emergency identification process.\n\n## Q: Can barcode scanning replace verbal verification?\nA: Barcode scanning can supplement but should not fully replace verbal verification. The patient should state their identifiers when possible.\n\n## Q: How do we handle neonates?\nA: Use mother's name + neonate medical record number. Apply ID bands before leaving delivery room.`,
    tags: ["patient identification", "IPSG.1", "FAQ", "safety"],
    author: "System",
    authorId: "system",
    relatedStandardIds: ["IPSG.1"],
    publishedAt: "2026-02-10",
    updatedAt: "2026-02-10",
    viewCount: 44,
    helpful: 20,
  },
];

const CATEGORY_ICONS: Record<KBArticleCategory, string> = {
  best_practice: "⭐",
  policy_guidance: "📋",
  regulatory_update: "📢",
  clinical_protocol: "🏥",
  safety_alert: "⚠️",
  how_to: "📖",
  faq: "❓",
};

type ViewMode = "browse" | "article" | "create";

const KnowledgeBasePage: React.FC = () => {
  const { currentUser } = useUserStore();
  const isAdmin = currentUser?.role === UserRole.Admin;

  const [articles, setArticles] = useState<KBArticle[]>(SEED_ARTICLES);
  const [view, setView] = useState<ViewMode>("browse");
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [form, setForm] = useState({
    title: "",
    category: "best_practice" as KBArticleCategory,
    summary: "",
    content: "",
    tags: "",
  });

  const filtered = useMemo(() => {
    let list = articles;
    if (filterCategory !== "all")
      list = list.filter((a) => a.category === filterCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list.sort(
      (a, b) =>
        (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) ||
        b.publishedAt.localeCompare(a.publishedAt),
    );
  }, [articles, filterCategory, searchQuery]);

  const openArticle = useCallback((a: KBArticle) => {
    setArticles((prev) =>
      prev.map((ar) =>
        ar.id === a.id ? { ...ar, viewCount: (ar.viewCount ?? 0) + 1 } : ar,
      ),
    );
    setSelectedArticle(a);
    setView("article");
  }, []);

  const markHelpful = useCallback((id: string) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, helpful: (a.helpful ?? 0) + 1 } : a,
      ),
    );
    setSelectedArticle((prev) =>
      prev ? { ...prev, helpful: (prev.helpful ?? 0) + 1 } : prev,
    );
  }, []);

  const handlePublish = useCallback(() => {
    if (!form.title || !form.content) return;
    const article: KBArticle = {
      id: `kb-${Date.now()}`,
      title: form.title,
      category: form.category,
      summary: form.summary,
      content: form.content,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      author: currentUser?.name ?? "Unknown",
      authorId: currentUser?.id ?? "",
      publishedAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    setArticles((prev) => [article, ...prev]);
    setForm({
      title: "",
      category: "best_practice",
      summary: "",
      content: "",
      tags: "",
    });
    setView("browse");
  }, [form, currentUser]);

  const inputCls =
    "text-sm border border-brand-border dark:border-dark-brand-border rounded-lg py-1.5 px-3 bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary w-full";

  // Category stats
  const catStats = useMemo(() => {
    const map: Record<string, number> = {};
    articles.forEach((a) => {
      map[a.category] = (map[a.category] ?? 0) + 1;
    });
    return map;
  }, [articles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <BookOpenIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
              Knowledge Base
            </h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
              Best practices, protocols, regulatory updates, and accreditation
              guidance
            </p>
          </div>
        </div>
        {isAdmin && view !== "create" && (
          <Button
            variant="primary"
            onClick={() => setView("create")}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" /> New Article
          </Button>
        )}
      </div>

      {/* ── Browse ── */}
      {view === "browse" && (
        <div className="space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="grow">
              <Input
                type="text"
                placeholder="Search articles, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<SearchIcon className="h-5 w-5" />}
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`${inputCls} w-auto sm:w-48`}
            >
              <option value="all">All Categories</option>
              {Object.entries(KB_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v} ({catStats[k] ?? 0})
                </option>
              ))}
            </select>
          </div>

          {/* Category Quick Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(
              Object.entries(KB_CATEGORY_LABELS) as [
                KBArticleCategory,
                string,
              ][]
            ).map(([cat, label]) => (
              <button
                key={cat}
                onClick={() =>
                  setFilterCategory(filterCategory === cat ? "all" : cat)
                }
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filterCategory === cat
                    ? "bg-brand-primary-600 text-white border-brand-primary-600"
                    : "bg-brand-surface dark:bg-dark-brand-surface border-brand-border dark:border-dark-brand-border text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {CATEGORY_ICONS[cat]} {label}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          {filtered.length === 0 ? (
            <EmptyState
              title="No Articles"
              description="No articles match your search."
              icon={<BookOpenIcon className="h-10 w-10 text-gray-400" />}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => openArticle(a)}
                  className="text-left border border-brand-border dark:border-dark-brand-border rounded-lg p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">
                      {CATEGORY_ICONS[a.category]}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-surface-alt dark:bg-dark-brand-surface-alt text-brand-text-secondary dark:text-dark-brand-text-secondary`}
                    >
                      {KB_CATEGORY_LABELS[a.category]}
                    </span>
                    {a.isPinned && (
                      <span className="text-[10px] text-yellow-500">
                        📌 Pinned
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-1 line-clamp-2">
                    {a.title}
                  </h3>
                  <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary line-clamp-2 mb-2">
                    {a.summary}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    <span>
                      {a.author} · {a.publishedAt}
                    </span>
                    <span className="flex gap-2">
                      {a.viewCount != null && <span>👁 {a.viewCount}</span>}
                      {a.helpful != null && <span>👍 {a.helpful}</span>}
                    </span>
                  </div>
                  {a.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] text-brand-text-secondary dark:text-dark-brand-text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Article Detail ── */}
      {view === "article" && selectedArticle && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedArticle(null);
              setView("browse");
            }}
            className="text-xs"
          >
            ← Back to Articles
          </Button>
          <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-lg p-6 max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">
                {CATEGORY_ICONS[selectedArticle.category]}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-surface-alt dark:bg-dark-brand-surface-alt text-brand-text-secondary dark:text-dark-brand-text-secondary">
                {KB_CATEGORY_LABELS[selectedArticle.category]}
              </span>
            </div>
            <h2 className="text-xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary mb-2">
              {selectedArticle.title}
            </h2>
            <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mb-4">
              By {selectedArticle.author} · Published{" "}
              {selectedArticle.publishedAt} · Updated{" "}
              {selectedArticle.updatedAt}
              {selectedArticle.viewCount != null &&
                ` · ${selectedArticle.viewCount} views`}
            </div>
            <div className="prose dark:prose-invert prose-sm max-w-none mb-6 text-brand-text-primary dark:text-dark-brand-text-primary whitespace-pre-line">
              {selectedArticle.content}
            </div>
            {selectedArticle.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {selectedArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 border-t border-brand-border dark:border-dark-brand-border pt-4">
              <span className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                Was this helpful?
              </span>
              <Button
                variant="ghost"
                onClick={() => markHelpful(selectedArticle.id)}
                className="text-xs"
              >
                👍 {selectedArticle.helpful ?? 0}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Article ── */}
      {view === "create" && isAdmin && (
        <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-lg p-6 max-w-2xl space-y-4">
          <Button
            variant="ghost"
            onClick={() => setView("browse")}
            className="text-xs"
          >
            ← Cancel
          </Button>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            New Article
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Title *
              </label>
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    category: e.target.value as KBArticleCategory,
                  }))
                }
                className={inputCls}
              >
                {Object.entries(KB_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Tags (comma-separated)
              </label>
              <input
                value={form.tags}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tags: e.target.value }))
                }
                className={inputCls}
                placeholder="e.g. infection control, JCI, PCI"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Summary *
              </label>
              <textarea
                value={form.summary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, summary: e.target.value }))
                }
                rows={2}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-brand-text-secondary dark:text-dark-brand-text-secondary mb-1">
                Content (Markdown) *
              </label>
              <textarea
                value={form.content}
                onChange={(e) =>
                  setForm((p) => ({ ...p, content: e.target.value }))
                }
                rows={12}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={!form.title || !form.content}
            >
              Publish
            </Button>
            <Button variant="ghost" onClick={() => setView("browse")}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBasePage;
