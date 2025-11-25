import React, { useMemo } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
// FIX: Corrected import path for UnifiedEvent
import { UnifiedEvent } from '../../pages/CalendarPage';

interface AgendaViewProps {
  currentDate: Date;
  events: UnifiedEvent[];
  onEventClick: (event: UnifiedEvent) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ currentDate, events, onEventClick }) => {
  const { t, lang } = useTranslation();
  
  const groupedEvents = useMemo(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const relevantEvents = events
      .filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= startOfMonth && eventDate <= endOfMonth;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return relevantEvents.reduce((acc, event) => {
      const dateKey = new Date(event.date).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, UnifiedEvent[]>);
  }, [events, currentDate]);

  return (
    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
      {Object.entries(groupedEvents).length > 0 ? Object.entries(groupedEvents).map(([date, dayEvents]: [string, UnifiedEvent[]]) => (
        <div key={date}>
          <h3 className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary text-sm pb-2 border-b-2 mb-2">
            {new Date(date).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          <div className="space-y-2">
            {dayEvents.map(event => (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="w-full text-left p-3 rounded-md border-l-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                style={{ borderLeftColor: event.color.startsWith('bg-') ? event.color.replace('bg-', '').replace('-500', '') : event.color }}
              >
                 <p className="font-semibold text-sm">{event.title}</p>
                 <p className="text-xs text-gray-500">{t((event.type.charAt(0).toLowerCase() + event.type.slice(1)) as any)}</p>
              </button>
            ))}
          </div>
        </div>
      )) : (
        <p className="text-center text-sm text-gray-500 py-16">{t('noEventsForMonth')}</p>
      )}
    </div>
  );
};

export default AgendaView;