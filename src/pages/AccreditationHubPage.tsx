import React, { useState } from "react";
import { AccreditationProgram, UserRole, NavigationState } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "../hooks/useToast";
import { useAppStore } from "../stores/useAppStore";
import { useProjectStore } from "../stores/useProjectStore";
import { useUserStore } from "../stores/useUserStore";
import ProgramCard from "../components/accreditation/ProgramCard";
import ProgramModal from "../components/accreditation/ProgramModal";
import ProgramImportExport from "../components/accreditation/ProgramImportExport";
import ProgramImportWizardModal from "../components/accreditation/ProgramImportWizardModal";
import RestrictedFeatureIndicator from "../components/common/RestrictedFeatureIndicator";
import { PlusIcon } from "../components/icons";
import EmptyState from "../components/common/EmptyState";
import { ShieldCheckIcon } from "../components/icons";
import { Button } from "@/components/ui";

interface AccreditationHubPageProps {
  setNavigation: (state: NavigationState) => void;
}

const AccreditationHubPage: React.FC<AccreditationHubPageProps> = ({
  setNavigation,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
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

  const canModify = currentUser?.role === UserRole.Admin;

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
    if (window.confirm(t("areYouSureDeleteProgram"))) {
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
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <Button
              onClick={() => {
                setEditingProgram(null);
                setIsModalOpen(true);
              }}
            >
              <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
              {t("createNewProgram")}
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
    </div>
  );
};

export default AccreditationHubPage;
