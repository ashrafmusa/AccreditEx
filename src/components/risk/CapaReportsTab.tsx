import React, { useEffect, useMemo, useState } from "react";
import { CAPAReport } from "../../types";
import { useTranslation } from "../../hooks/useTranslation";
import { useProjectStore } from "../../stores/useProjectStore";
import { useUserStore } from "../../stores/useUserStore";
import { getCAPAReports } from "../../services/capaService";
// FIX: Corrected import path for CapaListItem
import CapaListItem from "../dashboard/CapaListItem";
import EmptyState from "../common/EmptyState";
import { ExclamationTriangleIcon } from "../icons";

const CapaReportsTab: React.FC = () => {
  const { t } = useTranslation();
  const { projects } = useProjectStore();
  const { users } = useUserStore();
  const [standaloneCapas, setStandaloneCapas] = useState<CAPAReport[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCAPAReports()
      .then((reports) => {
        if (!cancelled) setStandaloneCapas(reports);
      })
      .catch((error: unknown) => {
        console.error("[CapaReportsTab] Failed to load standalone CAPAs:", error);
        if (!cancelled) setLoadError("errorLoadingCapaReports");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allCapas = useMemo(
    () => {
      const uniqueCapas = new Map<string, CAPAReport>();
      projects
        .flatMap((project) => project.capaReports || [])
        .filter((x): x is NonNullable<typeof x> => !!x)
        .forEach((capa) => uniqueCapas.set(capa.id, capa));
      standaloneCapas.forEach((capa) => uniqueCapas.set(capa.id, capa));
      return [...uniqueCapas.values()].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
    },
    [projects, standaloneCapas],
  );

  return (
    <div className="space-y-4">
      {loadError && (
        <p role="alert" className="text-red-700 dark:text-red-300">
          {t(loadError)}
        </p>
      )}
      {allCapas.length > 0 ? (
        allCapas.map((capa) => {
          // First try sourceProjectId, then search through all projects
          let project = projects.find((p) => p.id === capa?.sourceProjectId);
          if (!project) {
            project = projects.find((p) =>
              p.capaReports?.some((c) => c.id === capa.id),
            );
          }
          const assignee = users.find((u) => u.id === capa.assignedTo);
          return (
            <CapaListItem
              key={capa.id}
              capa={capa!}
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
