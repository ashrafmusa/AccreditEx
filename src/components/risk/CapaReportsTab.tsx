import React, { useMemo } from "react";
import { CAPAReport } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useProjectStore } from "../../stores/useProjectStore";
import { useUserStore } from "../../stores/useUserStore";
// FIX: Corrected import path for CapaListItem
import CapaListItem from "../dashboard/CapaListItem";
import EmptyState from "../common/EmptyState";
import { ExclamationTriangleIcon } from "../icons";

const CapaReportsTab: React.FC = () => {
  const { t } = useTranslation();
  const { projects } = useProjectStore();
  const { users } = useUserStore();

  const allCapas = useMemo(
    () =>
      projects
        .flatMap((p) => p.capaReports)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [projects]
  );

  return (
    <div className="space-y-4">
      {allCapas.length > 0 ? (
        allCapas.map((capa) => {
          // First try sourceProjectId, then search through all projects
          let project = projects.find((p) => p.id === capa.sourceProjectId);
          if (!project) {
            project = projects.find((p) =>
              p.capaReports?.some((c) => c.id === capa.id)
            );
          }
          const assignee = users.find((u) => u.id === capa.assignedTo);
          return (
            <CapaListItem
              key={capa.id}
              capa={capa}
              project={project}
              assignee={assignee}
            />
          );
        })
      ) : (
        <EmptyState
          icon={ExclamationTriangleIcon}
          title={t("noCapaReports")}
          message={t("noCapaReportsDescription")}
        />
      )}
    </div>
  );
};

export default CapaReportsTab;
