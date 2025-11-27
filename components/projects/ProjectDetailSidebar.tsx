import React from 'react';
import { ProjectDetailView } from '@/types';
import { 
  ChartBarIcon, 
  ClipboardDocumentCheckIcon, 
  CubeIcon, 
  ClipboardDocumentListIcon, 
  ClockIcon,
  ArrowPathIcon
} from '@/components/icons';

interface ProjectDetailSidebarProps {
  activeView: ProjectDetailView;
  setActiveView: (view: ProjectDetailView) => void;
}

const ProjectDetailSidebar: React.FC<ProjectDetailSidebarProps> = ({ activeView, setActiveView }) => {
  const navItems: { id: ProjectDetailView; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'checklist', label: 'Checklist', icon: ClipboardDocumentCheckIcon },
    { id: 'design_controls', label: 'Design Controls', icon: CubeIcon },
    { id: 'mock_surveys', label: 'Mock Surveys', icon: ClipboardDocumentListIcon },
    { id: 'pdca_cycles', label: 'PDCA Cycles', icon: ArrowPathIcon },
    { id: 'audit_log', label: 'Audit Log', icon: ClockIcon },
  ];

  return (
    <aside className="w-full lg:w-1/4 xl:w-1/5 bg-white dark:bg-dark-brand-surface rounded-xl shadow-sm border border-brand-border dark:border-dark-brand-border overflow-hidden">
      <nav className="flex flex-col p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
              activeView === item.id
                ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary-light'
                : 'text-brand-text-secondary hover:bg-slate-100 dark:text-dark-brand-text-secondary dark:hover:bg-slate-800'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default ProjectDetailSidebar;