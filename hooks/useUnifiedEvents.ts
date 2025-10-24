import { useMemo } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { useAppStore } from '../stores/useAppStore';
import { UnifiedEvent, CalendarEventType, NavigationState } from '../types';
import { useTranslation } from './useTranslation';

const eventColorMap: Record<CalendarEventType, string> = {
    Project: 'bg-blue-500',
    Survey: 'bg-purple-500',
    Document: 'bg-green-500',
    CAPA: 'bg-red-500',
    Custom: 'bg-gray-500',
};

export const useUnifiedEvents = (): UnifiedEvent[] => {
    const { projects } = useProjectStore();
    const { documents, customEvents } = useAppStore();
    const { t, lang } = useTranslation();

    const projectEvents = useMemo((): UnifiedEvent[] => {
        return projects.flatMap(p => 
            p.endDate ? [{
                id: `project-end-${p.id}`,
                type: 'Project' as const,
                date: p.endDate,
                title: `${t('project')} ${t('dueDate')}: ${p.name}`,
                color: eventColorMap.Project,
                link: { view: 'projectDetail', projectId: p.id } as NavigationState,
            }] : []
        );
    }, [projects, t]);

    const documentEvents = useMemo((): UnifiedEvent[] => {
        return documents.flatMap(d =>
            d.reviewDate ? [{
                id: `doc-review-${d.id}`,
                type: 'Document' as const,
                date: d.reviewDate,
                // FIX: Cast translation key to any
                title: `${t('document' as any)} ${t('review')}: ${d.name[lang]}`,
                color: eventColorMap.Document,
                link: { view: 'documentControl' } as NavigationState,
            }] : []
        );
    }, [documents, t, lang]);

    const capaEvents = useMemo((): UnifiedEvent[] => {
        return projects.flatMap(p =>
            p.capaReports.flatMap(c => 
                c.dueDate ? [{
                    id: `capa-due-${c.id}`,
                    type: 'CAPA' as const,
                    date: c.dueDate,
                    // FIX: Cast translation key to any
                    title: `${t('capa' as any)} ${t('dueDate')}: ${c.description.substring(0, 20)}...`,
                    color: eventColorMap.CAPA,
                    link: { view: 'projectDetail', projectId: p.id } as NavigationState,
                }] : []
            )
        );
    }, [projects, t]);

    const customCalEvents = useMemo((): UnifiedEvent[] => {
        return customEvents.map(e => ({
            ...e,
            id: e.id,
            title: e.title[lang],
            description: e.description?.[lang],
            color: eventColorMap.Custom,
            link: { view: 'calendar' } as NavigationState,
        }));
    }, [customEvents, lang]);
    
    return useMemo(() => [
        ...projectEvents,
        ...documentEvents,
        ...capaEvents,
        ...customCalEvents
    ], [projectEvents, documentEvents, capaEvents, customCalEvents]);
};