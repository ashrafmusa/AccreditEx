/**
 * ModuleGate — AccreditEx
 *
 * Wrapper component that conditionally renders children
 * only if the specified module is enabled for the current org.
 * Shows UpgradePrompt fallback when the module is disabled.
 *
 * Usage:
 *   <ModuleGate moduleId="labOperations">
 *     <LabOperationsPage />
 *   </ModuleGate>
 */

import React from "react";
import type { ModuleId } from "@/types/modules";
import { useModuleStore } from "@/stores/useModuleStore";
import UpgradePrompt from "./UpgradePrompt";

interface ModuleGateProps {
  /** The module to check */
  moduleId: ModuleId;
  /** Content to render when module is enabled */
  children: React.ReactNode;
  /** Optional: render nothing instead of UpgradePrompt when disabled */
  silent?: boolean;
}

const ModuleGate: React.FC<ModuleGateProps> = ({
  moduleId,
  children,
  silent = false,
}) => {
  const isEnabled = useModuleStore((s) => s.enabledModules.has(moduleId));

  if (isEnabled) {
    return <>{children}</>;
  }

  if (silent) {
    return null;
  }

  return <UpgradePrompt moduleId={moduleId} />;
};

export default ModuleGate;
