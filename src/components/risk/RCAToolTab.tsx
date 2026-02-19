import React, { useState, useCallback } from "react";
import {
  FishboneCategory,
  FishboneCause,
  FishboneAnalysis,
  FiveWhyStep,
  FiveWhyAnalysis,
  RootCauseAnalysisData,
  FISHBONE_CATEGORY_LABELS,
} from "@/types";
import { Button } from "@/components/ui";
import { PlusIcon, TrashIcon } from "@/components/icons";

// ── Colors per category ──────────────────────────────────

const CATEGORY_COLORS: Record<
  FishboneCategory,
  { bg: string; border: string; text: string }
> = {
  man: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-700 dark:text-blue-400",
  },
  machine: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-700 dark:text-purple-400",
  },
  method: {
    bg: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-300 dark:border-green-700",
    text: "text-green-700 dark:text-green-400",
  },
  material: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-300 dark:border-orange-700",
    text: "text-orange-700 dark:text-orange-400",
  },
  measurement: {
    bg: "bg-teal-50 dark:bg-teal-900/20",
    border: "border-teal-300 dark:border-teal-700",
    text: "text-teal-700 dark:text-teal-400",
  },
  environment: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-700 dark:text-amber-400",
  },
};

const ALL_CATEGORIES: FishboneCategory[] = [
  "man",
  "machine",
  "method",
  "material",
  "measurement",
  "environment",
];

const emptyFishbone = (): FishboneAnalysis => ({
  id: `fb-${Date.now()}`,
  problemStatement: "",
  categories: {
    man: [],
    machine: [],
    method: [],
    material: [],
    measurement: [],
    environment: [],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: "",
});

const uid = () => `c-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

// ── Fishbone Diagram Component ───────────────────────────

interface FishboneDiagramProps {
  fishbone: FishboneAnalysis;
  onChange: (fb: FishboneAnalysis) => void;
  readOnly?: boolean;
}

const FishboneDiagram: React.FC<FishboneDiagramProps> = ({
  fishbone,
  onChange,
  readOnly,
}) => {
  const addCause = (cat: FishboneCategory) => {
    const cause: FishboneCause = { id: uid(), text: "", subCauses: [] };
    onChange({
      ...fishbone,
      categories: {
        ...fishbone.categories,
        [cat]: [...fishbone.categories[cat], cause],
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const updateCause = (
    cat: FishboneCategory,
    causeId: string,
    text: string,
  ) => {
    onChange({
      ...fishbone,
      categories: {
        ...fishbone.categories,
        [cat]: fishbone.categories[cat].map((c) =>
          c.id === causeId ? { ...c, text } : c,
        ),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const removeCause = (cat: FishboneCategory, causeId: string) => {
    onChange({
      ...fishbone,
      categories: {
        ...fishbone.categories,
        [cat]: fishbone.categories[cat].filter((c) => c.id !== causeId),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const addSubCause = (cat: FishboneCategory, causeId: string) => {
    const sub: FishboneCause = { id: uid(), text: "" };
    onChange({
      ...fishbone,
      categories: {
        ...fishbone.categories,
        [cat]: fishbone.categories[cat].map((c) =>
          c.id === causeId
            ? { ...c, subCauses: [...(c.subCauses || []), sub] }
            : c,
        ),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const updateSubCause = (
    cat: FishboneCategory,
    causeId: string,
    subId: string,
    text: string,
  ) => {
    onChange({
      ...fishbone,
      categories: {
        ...fishbone.categories,
        [cat]: fishbone.categories[cat].map((c) =>
          c.id === causeId
            ? {
                ...c,
                subCauses: (c.subCauses || []).map((s) =>
                  s.id === subId ? { ...s, text } : s,
                ),
              }
            : c,
        ),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const removeSubCause = (
    cat: FishboneCategory,
    causeId: string,
    subId: string,
  ) => {
    onChange({
      ...fishbone,
      categories: {
        ...fishbone.categories,
        [cat]: fishbone.categories[cat].map((c) =>
          c.id === causeId
            ? {
                ...c,
                subCauses: (c.subCauses || []).filter((s) => s.id !== subId),
              }
            : c,
        ),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const topCats: FishboneCategory[] = ["man", "method", "measurement"];
  const botCats: FishboneCategory[] = ["machine", "material", "environment"];

  return (
    <div className="space-y-4">
      {/* Problem Statement (Fishbone "Head") */}
      <div className="flex items-center gap-3">
        <div className="shrink-0 text-sm font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
          Problem:
        </div>
        {readOnly ? (
          <div className="text-brand-text-primary dark:text-dark-brand-text-primary font-medium">
            {fishbone.problemStatement || "—"}
          </div>
        ) : (
          <input
            value={fishbone.problemStatement}
            onChange={(e) =>
              onChange({ ...fishbone, problemStatement: e.target.value })
            }
            className="grow border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-brand-text-primary dark:text-dark-brand-text-primary font-medium focus:ring-red-500 focus:border-red-500"
            placeholder="Describe the problem or effect..."
          />
        )}
      </div>

      {/* Fishbone Grid: 3 cols × 2 rows of categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {topCats.map((cat) => (
          <CategoryCard
            key={cat}
            cat={cat}
            causes={fishbone.categories[cat]}
            readOnly={readOnly}
            onAdd={() => addCause(cat)}
            onUpdate={(id, t) => updateCause(cat, id, t)}
            onRemove={(id) => removeCause(cat, id)}
            onAddSub={(id) => addSubCause(cat, id)}
            onUpdateSub={(cId, sId, t) => updateSubCause(cat, cId, sId, t)}
            onRemoveSub={(cId, sId) => removeSubCause(cat, cId, sId)}
          />
        ))}
        {botCats.map((cat) => (
          <CategoryCard
            key={cat}
            cat={cat}
            causes={fishbone.categories[cat]}
            readOnly={readOnly}
            onAdd={() => addCause(cat)}
            onUpdate={(id, t) => updateCause(cat, id, t)}
            onRemove={(id) => removeCause(cat, id)}
            onAddSub={(id) => addSubCause(cat, id)}
            onUpdateSub={(cId, sId, t) => updateSubCause(cat, cId, sId, t)}
            onRemoveSub={(cId, sId) => removeSubCause(cat, cId, sId)}
          />
        ))}
      </div>
    </div>
  );
};

interface CategoryCardProps {
  cat: FishboneCategory;
  causes: FishboneCause[];
  readOnly?: boolean;
  onAdd: () => void;
  onUpdate: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onAddSub: (causeId: string) => void;
  onUpdateSub: (causeId: string, subId: string, text: string) => void;
  onRemoveSub: (causeId: string, subId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  cat,
  causes,
  readOnly,
  onAdd,
  onUpdate,
  onRemove,
  onAddSub,
  onUpdateSub,
  onRemoveSub,
}) => {
  const colors = CATEGORY_COLORS[cat];
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-lg p-3`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-semibold text-sm ${colors.text}`}>
          {FISHBONE_CATEGORY_LABELS[cat]}
        </span>
        {!readOnly && (
          <button
            onClick={onAdd}
            className={`${colors.text} hover:opacity-70`}
            title="Add cause"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      {causes.length === 0 && (
        <div className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary italic">
          No causes yet
        </div>
      )}
      <div className="space-y-2">
        {causes.map((cause) => (
          <div key={cause.id}>
            <div className="flex items-center gap-1">
              {readOnly ? (
                <span className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                  {cause.text}
                </span>
              ) : (
                <>
                  <input
                    value={cause.text}
                    onChange={(e) => onUpdate(cause.id, e.target.value)}
                    className="grow border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 dark:text-dark-brand-text-primary"
                    placeholder="Potential cause..."
                  />
                  <button
                    onClick={() => onAddSub(cause.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Add sub-cause"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onRemove(cause.id)}
                    className="text-red-400 hover:text-red-600"
                    title="Remove"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            {/* Sub-causes */}
            {cause.subCauses && cause.subCauses.length > 0 && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-2">
                {cause.subCauses.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-1">
                    {readOnly ? (
                      <span className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                        ↳ {sub.text}
                      </span>
                    ) : (
                      <>
                        <input
                          value={sub.text}
                          onChange={(e) =>
                            onUpdateSub(cause.id, sub.id, e.target.value)
                          }
                          className="grow border border-gray-200 dark:border-gray-600 rounded px-2 py-0.5 text-[11px] bg-white dark:bg-gray-800 dark:text-dark-brand-text-primary"
                          placeholder="Sub-cause..."
                        />
                        <button
                          onClick={() => onRemoveSub(cause.id, sub.id)}
                          className="text-red-300 hover:text-red-500"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 5-Why Builder Component ──────────────────────────────

interface FiveWhyBuilderProps {
  analysis: FiveWhyAnalysis;
  onChange: (a: FiveWhyAnalysis) => void;
  readOnly?: boolean;
}

const FiveWhyBuilder: React.FC<FiveWhyBuilderProps> = ({
  analysis,
  onChange,
  readOnly,
}) => {
  const updateStep = (
    idx: number,
    field: "question" | "answer",
    value: string,
  ) => {
    const steps = [...analysis.steps];
    steps[idx] = { ...steps[idx], [field]: value };
    onChange({ ...analysis, steps });
  };

  const addStep = () => {
    if (analysis.steps.length >= 5) return;
    const n = analysis.steps.length + 1;
    onChange({
      ...analysis,
      steps: [
        ...analysis.steps,
        { whyNumber: n, question: `Why #${n}?`, answer: "" },
      ],
    });
  };

  const removeLastStep = () => {
    if (analysis.steps.length <= 1) return;
    onChange({ ...analysis, steps: analysis.steps.slice(0, -1) });
  };

  return (
    <div className="space-y-3">
      {analysis.steps.map((step, idx) => (
        <div
          key={idx}
          className="flex gap-3 items-start"
          style={{ paddingLeft: `${idx * 12}px` }}
        >
          <div className="shrink-0 w-8 h-8 rounded-full bg-brand-primary-500 text-white flex items-center justify-center text-xs font-bold">
            {step.whyNumber}
          </div>
          <div className="grow space-y-1">
            {readOnly ? (
              <>
                <div className="text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary">
                  {step.question}
                </div>
                <div className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary">
                  {step.answer || "—"}
                </div>
              </>
            ) : (
              <>
                <input
                  value={step.question}
                  onChange={(e) => updateStep(idx, "question", e.target.value)}
                  className="w-full border border-brand-border dark:border-dark-brand-border rounded px-3 py-1.5 text-sm bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary font-medium"
                  placeholder={`Why #${step.whyNumber}?`}
                />
                <textarea
                  value={step.answer}
                  onChange={(e) => updateStep(idx, "answer", e.target.value)}
                  className="w-full border border-brand-border dark:border-dark-brand-border rounded px-3 py-1.5 text-sm bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-secondary"
                  placeholder="Because..."
                  rows={2}
                />
              </>
            )}
          </div>
        </div>
      ))}
      {!readOnly && (
        <div className="flex gap-2 justify-end">
          {analysis.steps.length > 1 && (
            <Button
              variant="ghost"
              onClick={removeLastStep}
              className="text-xs"
            >
              Remove Last
            </Button>
          )}
          {analysis.steps.length < 5 && (
            <Button
              variant="ghost"
              onClick={addStep}
              className="text-xs flex items-center gap-1"
            >
              <PlusIcon className="h-3 w-3" /> Add Why
            </Button>
          )}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1 text-brand-text-secondary dark:text-dark-brand-text-secondary">
          Root Cause Conclusion
        </label>
        {readOnly ? (
          <div className="text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
            {analysis.rootCauseConclusion || "—"}
          </div>
        ) : (
          <textarea
            value={analysis.rootCauseConclusion}
            onChange={(e) =>
              onChange({ ...analysis, rootCauseConclusion: e.target.value })
            }
            className="w-full border border-brand-border dark:border-dark-brand-border rounded-lg px-3 py-2 text-sm bg-brand-surface dark:bg-dark-brand-surface dark:text-dark-brand-text-primary"
            placeholder="Based on the analysis above, the root cause is..."
            rows={2}
          />
        )}
      </div>
    </div>
  );
};

// ── Combined RCA Tool Tab for RiskHub ────────────────────

type ToolMode = "fishbone" | "fiveWhy";

const RCAToolTab: React.FC = () => {
  const [mode, setMode] = useState<ToolMode>("fishbone");
  const [fishbone, setFishbone] = useState<FishboneAnalysis>(emptyFishbone());
  const [fiveWhy, setFiveWhy] = useState<FiveWhyAnalysis>({
    id: `5w-${Date.now()}`,
    steps: [{ whyNumber: 1, question: "Why did this happen?", answer: "" }],
    rootCauseConclusion: "",
    createdAt: new Date().toISOString(),
  });
  const [savedAnalyses, setSavedAnalyses] = useState<RootCauseAnalysisData[]>(
    [],
  );

  const handleSave = useCallback(() => {
    const rca: RootCauseAnalysisData = {
      fishbone: mode === "fishbone" ? fishbone : undefined,
      fiveWhys: mode === "fiveWhy" ? [fiveWhy] : undefined,
    };
    setSavedAnalyses((prev) => [rca, ...prev]);
    // Reset
    if (mode === "fishbone") setFishbone(emptyFishbone());
    else
      setFiveWhy({
        id: `5w-${Date.now()}`,
        steps: [{ whyNumber: 1, question: "Why did this happen?", answer: "" }],
        rootCauseConclusion: "",
        createdAt: new Date().toISOString(),
      });
  }, [mode, fishbone, fiveWhy]);

  const handleReset = () => {
    if (mode === "fishbone") setFishbone(emptyFishbone());
    else
      setFiveWhy({
        id: `5w-${Date.now()}`,
        steps: [{ whyNumber: 1, question: "Why did this happen?", answer: "" }],
        rootCauseConclusion: "",
        createdAt: new Date().toISOString(),
      });
  };

  const totalCauses =
    mode === "fishbone"
      ? ALL_CATEGORIES.reduce(
          (sum, cat) => sum + fishbone.categories[cat].length,
          0,
        )
      : fiveWhy.steps.filter((s) => s.answer).length;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            Root Cause Analysis Tool
          </h3>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-0.5">
            Interactive Fishbone (Ishikawa) and 5-Why analysis for systematic
            problem solving
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleReset} className="text-xs">
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={
              mode === "fishbone"
                ? !fishbone.problemStatement
                : !fiveWhy.rootCauseConclusion
            }
            className="text-xs"
          >
            Save Analysis
          </Button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 border-b border-brand-border dark:border-dark-brand-border pb-2">
        <Button
          variant={mode === "fishbone" ? "primary" : "ghost"}
          onClick={() => setMode("fishbone")}
          className="text-sm"
        >
          🐟 Fishbone Diagram
        </Button>
        <Button
          variant={mode === "fiveWhy" ? "primary" : "ghost"}
          onClick={() => setMode("fiveWhy")}
          className="text-sm"
        >
          ❓ 5-Why Analysis
        </Button>
        <span className="ml-auto text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary self-center">
          {totalCauses} cause{totalCauses !== 1 ? "s" : ""} identified
        </span>
      </div>

      {/* Tool Content */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border rounded-xl p-4">
        {mode === "fishbone" ? (
          <FishboneDiagram fishbone={fishbone} onChange={setFishbone} />
        ) : (
          <FiveWhyBuilder analysis={fiveWhy} onChange={setFiveWhy} />
        )}
      </div>

      {/* Saved Analyses */}
      {savedAnalyses.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            Saved Analyses ({savedAnalyses.length})
          </h4>
          {savedAnalyses.map((rca, i) => (
            <div
              key={i}
              className="bg-brand-surface-alt dark:bg-dark-brand-surface-alt border border-brand-border dark:border-dark-brand-border rounded-lg p-3"
            >
              {rca.fishbone && (
                <div>
                  <span className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    🐟 Fishbone
                  </span>
                  <span className="ml-2 text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                    {rca.fishbone.problemStatement}
                  </span>
                  <span className="ml-2 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    (
                    {ALL_CATEGORIES.reduce(
                      (s, c) => s + rca.fishbone!.categories[c].length,
                      0,
                    )}{" "}
                    causes)
                  </span>
                </div>
              )}
              {rca.fiveWhys?.map((fw) => (
                <div key={fw.id}>
                  <span className="text-xs font-semibold text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    ❓ 5-Why
                  </span>
                  <span className="ml-2 text-sm text-brand-text-primary dark:text-dark-brand-text-primary">
                    {fw.rootCauseConclusion}
                  </span>
                  <span className="ml-2 text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary">
                    ({fw.steps.length} steps)
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RCAToolTab;
export { FishboneDiagram, FiveWhyBuilder };
