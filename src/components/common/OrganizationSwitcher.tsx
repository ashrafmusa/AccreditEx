import { BuildingOffice2Icon, LockClosedIcon } from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { getOrganization } from "@/services/organizationService";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import { Organization } from "@/types";
import React, { useEffect } from "react";

const OrganizationSwitcher: React.FC = () => {
  const { t, lang } = useTranslation();
  const currentUser = useUserStore((s) => s.currentUser);
  const currentOrganization = useTenantStore((s) => s.currentOrganization);
  const setOrganization = useTenantStore((s) => s.setOrganization);

  const getOrgDisplayName = (org: Organization): string => {
    if (lang === "ar" && org.nameAr) {
      return org.nameAr;
    }
    return org.name || org.id;
  };

  useEffect(() => {
    let isMounted = true;
    const ensureOwnOrgLoaded = async () => {
      if (!currentUser?.organizationId || currentOrganization?.id) return;
      try {
        const ownOrg = await getOrganization(currentUser.organizationId);
        if (isMounted && ownOrg) {
          setOrganization(ownOrg);
        }
      } catch {
        // Ignore transient load error
      }
    };
    void ensureOwnOrgLoaded();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.organizationId, currentOrganization?.id, setOrganization]);

  if (!currentUser || !currentOrganization) {
    return null;
  }

  return (
    <div
      className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface min-w-[200px]"
      title={`Strict Multi-Tenant Isolation Active (${currentOrganization.id}) — Encrypted & Isolated Workspace`}
    >
      <BuildingOffice2Icon className="h-4 w-4 text-brand-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-[10px] uppercase tracking-wide text-brand-text-secondary dark:text-dark-brand-text-secondary">
            {t("switchOrganization") || "Isolated Tenant"}
          </p>
          <LockClosedIcon className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-sm font-semibold text-brand-text-primary dark:text-dark-brand-text-primary truncate">
          {getOrgDisplayName(currentOrganization)}
        </p>
      </div>
    </div>
  );
};

export default OrganizationSwitcher;
