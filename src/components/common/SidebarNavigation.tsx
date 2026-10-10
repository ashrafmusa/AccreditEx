import React, { useEffect, useId, useState } from "react";
import { BeakerIcon, BuildingOffice2Icon, ChevronDownIcon, ShieldCheckIcon, ExclamationTriangleIcon } from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { prefetchRoute } from "@/services/routePrefetchService";
import type { NavigationState } from "@/types";

export interface SidebarItem {
  nav: NavigationState;
  key: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const primaryKeys = ["dashboard", "myTasks", "projects"];
const groups = [
  { key: "accreditation", label: "navGroupAccreditation", icon: ShieldCheckIcon,
    items: ["accreditationHub", "documentControl", "templateLibrary", "knowledgeBase"] },
  { key: "quality", label: "navGroupQuality", icon: ExclamationTriangleIcon,
    items: ["riskHub", "auditHub", "qualityTools", "qualityRounding", "qualityInsights", "changeControlHub"] },
  { key: "operations", label: "navGroupOperations", icon: BeakerIcon,
    items: ["labOperations", "trainingHub", "calendar", "messaging", "supplierHub", "workflowAutomation"] },
  { key: "administration", label: "navGroupAdministration", icon: BuildingOffice2Icon,
    items: ["analyticsHub", "reportBuilder", "dataHub", "departments", "multiFacility"] },
];

interface Props {
  items: SidebarItem[];
  isActive: (key: string) => boolean;
  onNavigate: (state: NavigationState) => void;
  expanded?: boolean;
  onExpand?: () => void;
  itemIdPrefix?: string;
}

const SidebarNavigation: React.FC<Props> = ({
  items, isActive, onNavigate, expanded = true, onExpand, itemIdPrefix = "nav-item",
}) => {
  const { t } = useTranslation();
  const id = useId();
  const activeGroup = groups.find(group => group.items.some(isActive))?.key;
  const [openGroups, setOpenGroups] = useState<string[]>([activeGroup || "accreditation"]);

  useEffect(() => {
    if (activeGroup) setOpenGroups(open => open.includes(activeGroup) ? open : [...open, activeGroup]);
  }, [activeGroup]);

  const renderItem = (item: SidebarItem) => (
    <li key={item.key}>
      <button type="button" id={`${itemIdPrefix}-${item.key}`} onClick={() => onNavigate(item.nav)}
        onPointerEnter={() => prefetchRoute(item.nav.view)}
        aria-label={item.label} aria-current={isActive(item.key) ? "page" : undefined}
        title={!expanded ? item.label : undefined}
        className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
          isActive(item.key) ? "bg-brand-primary text-white" : "text-brand-text-secondary dark:text-dark-brand-text-secondary hover:bg-brand-primary/10"
        }`}>
        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {expanded && <span className="min-w-0">{item.label}</span>}
      </button>
    </li>
  );

  return (
    <ul className="space-y-1">
      {primaryKeys.map(key => items.find(item => item.key === key)).filter((item): item is SidebarItem => !!item).map(renderItem)}
      {groups.map(group => {
        const members = group.items.map(key => items.find(item => item.key === key))
          .filter((item): item is SidebarItem => !!item);
        if (!members.length) return null;
        const open = expanded && openGroups.includes(group.key);
        const label = t(group.label);
        const panelId = `${id}-${group.key}`;
        return (
          <li key={group.key} className="border-t border-brand-border dark:border-dark-brand-border pt-1">
            <button type="button" aria-label={label} aria-expanded={open} aria-controls={panelId}
              title={!expanded ? label : undefined}
              onClick={() => {
                if (!expanded) {
                  onExpand?.();
                  setOpenGroups(previous => previous.includes(group.key) ? previous : [...previous, group.key]);
                } else setOpenGroups(previous => previous.includes(group.key)
                  ? previous.filter(key => key !== group.key) : [...previous, group.key]);
              }}
              className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-semibold hover:bg-brand-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
                activeGroup === group.key ? "text-brand-primary bg-brand-primary/5" : "text-brand-text-primary dark:text-dark-brand-text-primary"
              }`}>
              <group.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {expanded && <>
                <span className="flex-1">{label}</span>
                <ChevronDownIcon className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
              </>}
            </button>
            <ul id={panelId} hidden={!open} aria-label={label} className="space-y-1 ps-2 pb-2">
              {members.map(renderItem)}
            </ul>
          </li>
        );
      })}
    </ul>
  );
};

export default SidebarNavigation;
