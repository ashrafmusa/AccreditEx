import { Button } from "@/components/ui";
import { useConfirmStore } from "@/stores/useConfirmStore";
import React, { lazy, Suspense, useState } from "react";
import ProgramCard from "../components/accreditation/ProgramCard";
import ProgramImportExport from "../components/accreditation/ProgramImportExport";
import ProgramImportWizardModal from "../components/accreditation/ProgramImportWizardModal";
import ProgramModal from "../components/accreditation/ProgramModal";
import EmptyState from "../components/common/EmptyState";
import RestrictedFeatureIndicator from "../components/common/RestrictedFeatureIndicator";
import { PlusIcon, ShieldCheckIcon } from "../components/icons";
import { useToast } from "../hooks/useToast";
import { useTranslation } from "../hooks/useTranslation";
import {
  hasOhasSmcsProjects,
  seedOhasSmcsProjects,
} from "../services/ohasService";
import { useAppStore } from "../stores/useAppStore";
import { useProjectStore } from "../stores/useProjectStore";
import { useUserStore } from "../stores/useUserStore";
import { AccreditationProgram, NavigationState, UserRole } from "../types";
const EwsScoreModal = lazy(() => import("@/components/clinical/EwsScoreModal"));
const BurnsCalculatorModal = lazy(
  () => import("@/components/clinical/BurnsCalculatorModal"),
);

interface AccreditationHubPageProps {
  setNavigation: (state: NavigationState) => void;
}

const AccreditationHubPage: React.FC<AccreditationHubPageProps> = ({
  setNavigation,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [showEws, setShowEws] = useState(false);
  const [showBurns, setShowBurns] = useState(false);
  const {
    accreditationPrograms,
    standards,
    addProgram,
    updateProgram,
    deleteProgram,
  } = useAppStore();
  const { projects } = useProjectStore();
  const { currentUser } = useUserStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [editingProgram, setEditingProgram] =
    useState<AccreditationProgram | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Centralized permission check — Viewer role gets read-only automatically
  const canModify = currentUser?.role === UserRole.Admin;

  const alreadySeeded = hasOhasSmcsProjects(projects);

  const handleSeedOhas = async () => {
    if (
      !(await useConfirmStore
        .getState()
        .confirm(
          "This will create 14 pre-built OHAS/SMCS accreditation projects covering all Oman Specialized Medical Care Services departments. Continue?",
          "Seed OHAS/SMCS Projects",
          "Seed 14 Projects",
        ))
    )
      return;
    setIsSeeding(true);
    try {
      const result = await seedOhasSmcsProjects();
      if (result.errors.length === 0) {
        toast.success(
          `✓ ${result.created} SMCS projects created: ${result.departments.slice(0, 3).join(", ")}${result.created > 3 ? ` +${result.created - 3} more` : ""}.`,
        );
      } else {
        toast.warning(
          `Created ${result.created} projects. ${result.errors.length} failed: ${result.errors[0]}`,
        );
      }
      // Refresh projects list
      await useProjectStore.getState().fetchAllProjects();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Seed failed: ${msg}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSave = (
    programData: AccreditationProgram | Omit<AccreditationProgram, "id">,
  ) => {
    if ("id" in programData) {
      updateProgram(programData);
    } else {
      addProgram(programData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (programId: string) => {
    if (
      await useConfirmStore
        .getState()
        .confirm(
          t("areYouSureDeleteProgram"),
          t("deleteProgram") || "Delete Program",
          t("delete") || "Delete",
        )
    ) {
      try {
        await deleteProgram(programId);
        toast.success(
          t("programDeletedSuccessfully") || "Program deleted successfully",
        );
      } catch {
        toast.error(t("failedToDeleteProgram") || "Failed to delete program");
      }
    }
  };

  const handleImportPrograms = async (
    programs: AccreditationProgram[],
    mode: "add" | "replace",
  ) => {
    try {
      if (mode === "replace") {
        for (const prog of accreditationPrograms) {
          await deleteProgram(prog.id);
        }
      }

      let successCount = 0;
      let failCount = 0;

      for (const prog of programs) {
        try {
          const { id: _discardId, ...programData } =
            prog as AccreditationProgram & { id?: string };
          await addProgram(programData);
          successCount++;
        } catch (error) {
          console.error("Failed to import program:", prog.name, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `${t("successfully")} ${t("imported")} ${successCount} ${t(
            "programs",
          ).toLowerCase()}${failCount > 0 ? ` (${failCount} failed)` : ""}`,
        );
      } else {
        toast.error(
          "All programs failed to import. Check browser console for details.",
        );
      }
      setIsImportWizardOpen(false);
    } catch (error) {
      console.error("Import programs error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Import failed: ${msg}`);
    }
  };

  return (
    <div className="space-y-6">
      {canModify && (
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
            <Button
              onClick={() => {
                setEditingProgram(null);
                setIsModalOpen(true);
              }}
            >
              <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              {t("createNewProgram")}
            </Button>
            {/* Oman SMCS one-click seeder */}
            <Button
              variant="secondary"
              onClick={handleSeedOhas}
              disabled={isSeeding || alreadySeeded}
              title={
                alreadySeeded
                  ? "OHAS/SMCS projects already seeded"
                  : "Create 14 pre-built SMCS department projects"
              }
            >
              {isSeeding
                ? "Seeding…"
                : alreadySeeded
                  ? "✓ OHAS/SMCS Seeded"
                  : "🏥 Seed OHAS/SMCS (14 Projects)"}
            </Button>
            {/* SMCS Clinical Calculators */}
            <Button
              variant="secondary"
              onClick={() => setShowEws(true)}
              title="NEWS2 Early Warning Score Calculator — SMCS.87"
            >
              📊 NEWS2 Score
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowBurns(true)}
              title="Burns Parkland Fluid Resuscitation Calculator"
            >
              🔥 Burns Calculator
            </Button>
          </div>
          <ProgramImportExport
            programs={accreditationPrograms}
            onImportClick={() => setIsImportWizardOpen(true)}
          />
        </div>
      )}

      {!canModify && (
        <RestrictedFeatureIndicator featureName="Accreditation Programs Management" />
      )}

      {accreditationPrograms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {accreditationPrograms.map((prog) => (
            <ProgramCard
              key={prog.id}
              program={prog}
              standardCount={
                standards.filter((s) => s.programId === prog.id).length
              }
              projectCount={
                projects.filter((p) => p.programId === prog.id).length
              }
              canModify={canModify}
              onSelect={() =>
                setNavigation({ view: "standards", programId: prog.id })
              }
              onEdit={() => {
                setEditingProgram(prog);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDelete(prog.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheckIcon}
          title={t("noProgramsFound")}
          message={canModify ? t("createProgramToStart") : ""}
        />
      )}

      {isModalOpen && (
        <ProgramModal
          program={editingProgram}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isImportWizardOpen && (
        <ProgramImportWizardModal
          isOpen={isImportWizardOpen}
          onClose={() => setIsImportWizardOpen(false)}
          onConfirmImport={handleImportPrograms}
          existingProgramCount={accreditationPrograms.length}
        />
      )}

      {showEws && (
        <Suspense fallback={null}>
          <EwsScoreModal onClose={() => setShowEws(false)} />
        </Suspense>
      )}

      {showBurns && (
        <Suspense fallback={null}>
          <BurnsCalculatorModal onClose={() => setShowBurns(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default AccreditationHubPage;
