import { BuildingOffice2Icon, ChevronDownIcon } from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import {
  checkIsSuperAdmin,
  getOrganization,
  listAllOrganizations,
} from "@/services/organizationService";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import { Organization } from "@/types";
import React, { useEffect, useMemo, useState } from "react";

const OrganizationSwitcher: React.FC = () => {
  const { t, lang } = useTranslation();

  const getOrgDisplayName = (org: Organization): string => {
    if (lang === "ar" && org.nameAr) {
      return org.nameAr;
    }
    return org.name || org.id;
  };
  const currentUser = useUserStore((s) => s.currentUser);
  const currentOrganization = useTenantStore((s) => s.currentOrganization);
  const setOrganization = useTenantStore((s) => s.setOrganization);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadOrganizations = async () => {
      if (!currentUser) return;
      setLoading(true);

      try {
        const superAdmin = await checkIsSuperAdmin();
        if (!isMounted) return;
        setIsSuperAdmin(superAdmin);

        if (superAdmin) {
          const allOrgs = await listAllOrganizations();
          if (!isMounted) return;
          setOrganizations(allOrgs);
          return;
        }

        if (currentUser.organizationId) {
          const ownOrg = await getOrganization(currentUser.organizationId);
          if (!isMounted) return;
          setOrganizations(ownOrg ? [ownOrg] : []);
          if (ownOrg && !currentOrganization?.id) {
            setOrganization(ownOrg);
          }
          return;
        }

        if (currentOrganization) {
          setOrganizations([currentOrganization]);
        }
      } catch (error) {
        console.warn("Failed to load organizations for switcher", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadOrganizations();

    return () => {
      isMounted = false;
    };
  }, [currentUser, currentOrganization?.id, setOrganization, lang]);

  const selectedOrgId = useMemo(() => {
    return currentOrganization?.id || organizations[0]?.id || "";
  }, [currentOrganization?.id, organizations]);

  const handleOrganizationChange = (orgId: string) => {
    const selectedOrg = organizations.find((org) => org.id === orgId);
    if (selectedOrg) {
      setOrganization(selectedOrg);
    }
  };

  if (!currentUser || organizations.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-border dark:border-dark-brand-border bg-brand-surface dark:bg-dark-brand-surface min-w-[220px]">
      <BuildingOffice2Icon className="h-4 w-4 text-brand-text-secondary dark:text-dark-brand-text-secondary" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-brand-text-secondary dark:text-dark-brand-text-secondary">
          {t("switchOrganization") || "Organization"}
        </p>
        <div className="relative">
          <select
            value={selectedOrgId}
            onChange={(e) => handleOrganizationChange(e.target.value)}
            disabled={loading || (!isSuperAdmin && organizations.length <= 1)}
            className="w-full appearance-none bg-transparent text-sm font-medium text-brand-text-primary dark:text-dark-brand-text-primary pr-5 focus:outline-none disabled:opacity-80"
            aria-label={t("switchOrganization") || "Switch organization"}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {getOrgDisplayName(org)}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-text-secondary dark:text-dark-brand-text-secondary" />
        </div>
      </div>
    </div>
  );
};

export default OrganizationSwitcher;
