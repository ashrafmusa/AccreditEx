import React, { useState, useMemo } from 'react';
import { Project, CAPAReport, PDCACycle, PDCAStage } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { PlusIcon, FunnelIcon } from '../icons';
import PDCACycleCard from './PDCACycleCard';
import PDCAStageTransitionForm from './PDCAStageTransitionForm';

interface PDCACycleManagerProps {
  project: Project;
  onUpdate: (project: Project) => void;
}

const PDCACycleManager: React.FC<PDCACycleManagerProps> = ({ project, onUpdate }) => {
  const { t } = useTranslation();
  const [selectedItem, setSelectedItem] = useState<{ item: CAPAReport | PDCACycle; type: 'capa' | 'cycle' } | null>(null);
  const [showTransitionForm, setShowTransitionForm] = useState(false);
  const [transitioningItem, setTransitioningItem] = useState<{ item: CAPAReport | PDCACycle; type: 'capa' | 'cycle' } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine CAPAs and standalone cycles
  const allItems = useMemo(() => {
    const capaItems = project.capaReports.map(capa => ({ item: capa, type: 'capa' as const }));
    const cycleItems = (project.pdcaCycles || []).map(cycle => ({ item: cycle, type: 'cycle' as const }));
    return [...capaItems, ...cycleItems];
  }, [project.capaReports, project.pdcaCycles]);

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(({ item, type }) => {
      // Search filter
      if (searchQuery) {
        const title = type === 'capa' ? (item as CAPAReport).description : (item as PDCACycle).title;
        if (!title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Category filter
      if (filterCategory !== 'all') {
        if (type === 'cycle') {
          if ((item as PDCACycle).category !== filterCategory) {
            return false;
          }
        } else if (filterCategory !== 'CAPA') {
          return false;
        }
      }

      // Priority filter
      if (filterPriority !== 'all') {
        if (type === 'cycle') {
          if ((item as PDCACycle).priority !== filterPriority) {
            return false;
          }
        }
      }

      return true;
    });
  }, [allItems, searchQuery, filterCategory, filterPriority]);

  // Group by stage
  const itemsByStage = useMemo(() => {
    const stages: PDCAStage[] = ['Plan', 'Do', 'Check', 'Act', 'Completed'];
    const grouped: Record<PDCAStage, typeof filteredItems> = {
      Plan: [],
      Do: [],
      Check: [],
      Act: [],
      Completed: []
    };

    filteredItems.forEach(({ item, type }) => {
      const stage = type === 'capa' 
        ? (item as CAPAReport).pdcaStage || 'Plan'
        : (item as PDCACycle).currentStage;
      grouped[stage].push({ item, type });
    });

    return grouped;
  }, [filteredItems]);

  // Handle stage advancement
  const handleAdvanceStage = (item: CAPAReport | PDCACycle, type: 'capa' | 'cycle') => {
    setTransitioningItem({ item, type });
    setShowTransitionForm(true);
  };

  const handleConfirmTransition = (notes: string, attachments: string[]) => {
    if (!transitioningItem) return;

    const { item, type } = transitioningItem;
    const currentStage = type === 'capa' 
      ? (item as CAPAReport).pdcaStage || 'Plan'
      : (item as PDCACycle).currentStage;

    // Get next stage
    const stageOrder: PDCAStage[] = ['Plan', 'Do', 'Check', 'Act', 'Completed'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const nextStage = stageOrder[currentIndex + 1];

    if (!nextStage) return;

    // Create stage history entry
    const historyEntry = {
      stage: currentStage,
      enteredAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      completedBy: 'current-user-id', // TODO: Get from auth context
      notes,
      attachments
    };

    // Update the item
    if (type === 'capa') {
      const updatedCapas = project.capaReports.map(capa => {
        if (capa.id === item.id) {
          return {
            ...capa,
            pdcaStage: nextStage,
            pdcaHistory: [...(capa.pdcaHistory || []), historyEntry]
          };
        }
        return capa;
      });

      onUpdate({
        ...project,
        capaReports: updatedCapas
      });
    } else {
      const updatedCycles = (project.pdcaCycles || []).map(cycle => {
        if (cycle.id === item.id) {
          return {
            ...cycle,
            currentStage: nextStage,
            stageHistory: [...cycle.stageHistory, historyEntry]
          };
        }
        return cycle;
      });

      onUpdate({
        ...project,
        pdcaCycles: updatedCycles
      });
    }

    setShowTransitionForm(false);
    setTransitioningItem(null);
  };

  // Get stage color
  const getStageColor = (stage: PDCAStage) => {
    switch (stage) {
      case 'Plan': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'Do': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'Check': return 'border-purple-500 bg-purple-50 dark:bg-purple-900/10';
      case 'Act': return 'border-green-500 bg-green-50 dark:bg-green-900/10';
      case 'Completed': return 'border-gray-400 bg-gray-50 dark:bg-gray-800/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t('pdcaCycles') || 'PDCA Cycles'}
          </h2>
          <p className="text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t('continuousImprovement') || 'Continuous Improvement Management'}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors"
          onClick={() => {/* TODO: Implement create new cycle */}}
        >
          <PlusIcon className="h-5 w-5" />
          {t('newPDCACycle') || 'New PDCA Cycle'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg p-4 border border-brand-border dark:border-dark-brand-border">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-brand-text-secondary dark:text-dark-brand-text-secondary" />
          <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
            {t('filters')}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder={t('searchCycles') || 'Search cycles...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary"
          />
          
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary"
          >
            <option value="all">{t('allCategories') || 'All Categories'}</option>
            <option value="CAPA">CAPA</option>
            <option value="Process">{t('process') || 'Process'}</option>
            <option value="Quality">{t('quality') || 'Quality'}</option>
            <option value="Safety">{t('safety') || 'Safety'}</option>
            <option value="Efficiency">{t('efficiency') || 'Efficiency'}</option>
            <option value="Other">{t('other') || 'Other'}</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-brand-border dark:border-dark-brand-border rounded-lg bg-brand-surface dark:bg-dark-brand-surface text-brand-text-primary dark:text-dark-brand-text-primary"
          >
            <option value="all">{t('allPriorities') || 'All Priorities'}</option>
            <option value="High">{t('high') || 'High'}</option>
            <option value="Medium">{t('medium') || 'Medium'}</option>
            <option value="Low">{t('low') || 'Low'}</option>
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {(['Plan', 'Do', 'Check', 'Act', 'Completed'] as PDCAStage[]).map((stage) => (
          <div key={stage} className={`border-t-4 ${getStageColor(stage)} rounded-lg p-4`}>
            {/* Column Header */}
            <div className="mb-4">
              <h3 className="font-bold text-brand-text-primary dark:text-dark-brand-text-primary text-lg">
                {t(`${stage.toLowerCase()}Stage`) || stage}
              </h3>
              <p className="text-xs text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
                {itemsByStage[stage].length} {t('items') || 'items'}
              </p>
            </div>

            {/* Cards */}
            <div className="space-y-3 min-h-[200px]">
              {itemsByStage[stage].length === 0 ? (
                <div className="text-center py-8 text-brand-text-secondary dark:text-dark-brand-text-secondary text-sm">
                  {t('noItemsInStage') || 'No items in this stage'}
                </div>
              ) : (
                itemsByStage[stage].map(({ item, type }) => (
                  <PDCACycleCard
                    key={`${type}-${item.id}`}
                    item={item}
                    type={type}
                    onView={() => setSelectedItem({ item, type })}
                    onAdvanceStage={stage !== 'Completed' ? () => handleAdvanceStage(item, type) : undefined}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Stage Transition Form */}
      {showTransitionForm && transitioningItem && (
        <PDCAStageTransitionForm
          currentStage={
            transitioningItem.type === 'capa'
              ? (transitioningItem.item as CAPAReport).pdcaStage || 'Plan'
              : (transitioningItem.item as PDCACycle).currentStage
          }
          onConfirm={handleConfirmTransition}
          onCancel={() => {
            setShowTransitionForm(false);
            setTransitioningItem(null);
          }}
        />
      )}

      {/* TODO: Add detail modal for viewing/editing cycles */}
    </div>
  );
};

export default PDCACycleManager;
