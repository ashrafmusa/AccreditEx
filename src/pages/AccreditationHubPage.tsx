import React, { useState } from 'react';
import { AccreditationProgram, UserRole, NavigationState } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useToast } from '../hooks/useToast';
import { useAppStore } from '../stores/useAppStore';
import { useProjectStore } from '../stores/useProjectStore';
import { useUserStore } from '../stores/useUserStore';
import ProgramCard from '../components/accreditation/ProgramCard';
import ProgramModal from '../components/accreditation/ProgramModal';
import ProgramImportExport from '../components/accreditation/ProgramImportExport';
import ProgramImportWizardModal from '../components/accreditation/ProgramImportWizardModal';
import RestrictedFeatureIndicator from '../components/common/RestrictedFeatureIndicator';
import { PlusIcon } from '../components/icons';
import EmptyState from '../components/common/EmptyState';
import { ShieldCheckIcon } from '../components/icons';
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
    programData: AccreditationProgram | Omit<AccreditationProgram, "id">
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
        toast.success(t("programDeletedSuccessfully") || "Program deleted successfully");
      } catch {
        toast.error(t("failedToDeleteProgram") || "Failed to delete program");
      }
    }
  };

  const handleImportPrograms = (
    programs: AccreditationProgram[],
    mode: "add" | "replace"
  ) => {
    try {
      if (mode === "replace") {
        // Delete all existing programs
        accreditationPrograms.forEach((prog) => deleteProgram(prog.id));
      }
      // Add imported programs
      programs.forEach((prog) => {
        // Remove ID if it doesn't exist, let Firebase generate it
        if ("id" in prog && prog.id) {
          addProgram(prog);
        } else {
          // No ID provided, add without ID so Firebase generates one
          const { id, ...programDataWithoutId } = prog;
          addProgram(programDataWithoutId);
        }
      });
      toast.success(
        `${t("successfully")} ${t("imported")} ${programs.length} ${t(
          "programs"
        ).toLowerCase()}`
      );
      setIsImportWizardOpen(false);
    } catch (error) {
      toast.error(t("importFailed"));
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
            onImport={() => setIsImportWizardOpen(true)}
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
