import { useEffect, useState } from "react";
import { subscribeToProject } from "@/services/projectService";
import { useProjectStore } from "@/stores/useProjectStore";
import { useTenantStore } from "@/stores/useTenantStore";

export function useProjectRecord(projectId: string) {
  const organizationId = useTenantStore((state) => state.organizationId);
  const project = useProjectStore((state) =>
    state.projects.find(
      (item) =>
        item.id === projectId &&
        (!organizationId || item.organizationId === organizationId),
    ),
  );
  const applySnapshot = useProjectStore((state) => state.applyProjectSnapshot);
  const [request, setRequest] = useState(0);
  const [state, setState] = useState<{
    id: string;
    loading: boolean;
    failed: boolean;
    missing: boolean;
  }>({
    id: projectId,
    loading: true,
    failed: false,
    missing: false,
  });

  useEffect(() => {
    let active = true;
    setState({ id: projectId, loading: true, failed: false, missing: false });
    const onFailure = (error: unknown) => {
      if (!active) return;
      console.error("Project subscription failed:", error);
      setState({ id: projectId, loading: false, failed: true, missing: false });
    };
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToProject(
        projectId,
        (record) => {
          if (!active) return;
          const allowedRecord =
            record &&
            (!organizationId || record.organizationId === organizationId)
              ? record
              : null;
          applySnapshot(projectId, allowedRecord);
          setState({
            id: projectId,
            loading: false,
            failed: false,
            missing: !allowedRecord,
          });
        },
        onFailure,
      );
    } catch (error) {
      onFailure(error);
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [projectId, organizationId, request, applySnapshot]);

  return {
    project,
    loading: state.id !== projectId || state.loading,
    failed: state.id === projectId && state.failed,
    missing: state.id === projectId && state.missing,
    retry: () => setRequest((value) => value + 1),
  };
}
