import React, { useState } from 'react';
import { NavigationState } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { CalendarDaysIcon } from '../components/icons';
import CalendarHeader from '../components/calendar/CalendarHeader';
import CalendarGrid from '../components/calendar/CalendarGrid';
import AgendaView from '../components/calendar/AgendaView';
import YearView from '../components/calendar/YearView';
import EventModal from '../components/calendar/EventModal';
import DayDetailModal from '../components/calendar/DayDetailModal';
import { useUnifiedEvents } from '../hooks/useUnifiedEvents';
import { useAppStore } from '../stores/useAppStore';

// Types exported for use in child components
export type CalendarView = 'month' | 'agenda' | 'year';
export type CalendarEventType = 'Project' | 'Survey' | 'Document' | 'CAPA' | 'Custom';
export interface UnifiedEvent {
  id: string;
  type: CalendarEventType;
  date: string;
  title: string;
  description?: string;
  color: string;
  link: NavigationState;
}

interface CalendarPageProps {
  setNavigation: (state: NavigationState) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ setNavigation }) => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventToEdit, setEventToEdit] = useState<UnifiedEvent | null>(null);

  const { addCustomEvent, updateCustomEvent, deleteCustomEvent } = useAppStore();
  const allEvents = useUnifiedEvents();

  const handleAddEvent = () => {
    setEventToEdit(null);
    setIsEventModalOpen(true);
    setIsDayModalOpen(false);
  };

  const handleEventClick = (event: UnifiedEvent) => {
    if (event.type === 'Custom') {
        setEventToEdit(event);
        setIsEventModalOpen(true);
    } else {
        setNavigation(event.link);
    }
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setIsDayModalOpen(true);
  };
  
  const handleSaveEvent = (eventData: Omit<UnifiedEvent, 'id' | 'type' | 'color' | 'link'>, id?: string) => {
    if (id) {
      updateCustomEvent({ ...eventData, id, type: 'Custom' });
    } else {
      addCustomEvent(eventData);
    }
    setIsEventModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm(t('areYouSureDeleteEvent'))) {
      deleteCustomEvent(id);
      setIsEventModalOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <CalendarDaysIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('complianceCalendar')}</h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('calendarPageDescription')}</p>
        </div>
      </div>
      
      <div className="bg-brand-surface dark:bg-dark-brand-surface p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-dark-brand-border">
          <CalendarHeader
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            view={view}
            setView={setView}
            onAddEvent={handleAddEvent}
          />
          <div className="mt-6">
              {view === 'month' && <CalendarGrid currentDate={currentDate} events={allEvents} onDayClick={handleDayClick} onEventClick={handleEventClick} />}
              {view === 'agenda' && <AgendaView currentDate={currentDate} events={allEvents} onEventClick={handleEventClick} />}
              {view === 'year' && <YearView currentDate={currentDate} events={allEvents} setCurrentDate={setCurrentDate} setView={setView} />}
          </div>
      </div>

      <EventModal 
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedDate={selectedDate}
        eventToEdit={eventToEdit as any}
      />
      
      <DayDetailModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        date={selectedDate}
        events={allEvents.filter(e => new Date(e.date).toDateString() === selectedDate.toDateString())}
        onAddEvent={handleAddEvent}
        onEventClick={handleEventClick}
      />
    </div>
  );
};

export default CalendarPage;