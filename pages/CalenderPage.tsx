import React, { useState, useMemo } from "react";
import { useTranslation } from "../hooks/useTranslation";
import { useProjectStore } from "../stores/useProjectStore";
import { useAppStore } from "../stores/useAppStore";
import { NavigationState, CustomCalendarEvent, Language } from "@/types";
import CalendarHeader from "../components/calendar/CalendarHeader";
import CalendarGrid from "../components/calendar/CalendarGrid";
import AgendaView from "../components/calendar/AgendaView";
import YearView from "../components/calendar/YearView";
import EventModal from "../components/calendar/EventModal";
import DayDetailModal from "../components/calendar/DayDetailModal";
import { CalendarDaysIcon } from "../components/icons";

export type CalendarView = "month" | "agenda" | "year";
export type CalendarEventType =
  | "Project"
  | "Survey"
  | "Document"
  | "CAPA"
  | "Custom";

export interface UnifiedEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  color: string;
  link?: NavigationState;
  description?: string;
}

const eventTypeColors: Record<CalendarEventType, string> = {
  Project: "bg-blue-500",
  Survey: "bg-purple-500",
  Document: "bg-green-500",
  CAPA: "bg-red-500",
  Custom: "bg-yellow-500",
};

const CalendarPage: React.FC<{
  setNavigation: (state: NavigationState) => void;
}> = ({ setNavigation }) => {
  const { t, lang } = useTranslation();
  const { projects } = useProjectStore();
  const {
    documents,
    customEvents,
    addCustomEvent,
    updateCustomEvent,
    deleteCustomEvent,
  } = useAppStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDayDetailModalOpen, setIsDayDetailModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventToEdit, setEventToEdit] = useState<CustomCalendarEvent | null>(
    null
  );

  const unifiedEvents = useMemo<UnifiedEvent[]>(() => {
    const events: UnifiedEvent[] = [];

    // Project end dates
    projects.forEach((p) => {
      if (p.endDate) {
        events.push({
          id: `proj-${p.id}`,
          title: `${t("project")} - ${p.name}`,
          date: p.endDate,
          type: "Project",
          color: eventTypeColors.Project,
          link: { view: "projectDetail", projectId: p.id },
        });
      }
    });

    // Document review dates
    documents.forEach((d) => {
      if (d.reviewDate) {
        events.push({
          id: `doc-${d.id}`,
          title: `${t("document")} - ${d.name[lang as Language]}`,
          date: d.reviewDate,
          type: "Document",
          color: eventTypeColors.Document,
          link: { view: "documentControl" },
        });
      }
    });

    // CAPA due dates
    projects
      .flatMap((p) => p.capaReports)
      .forEach((c) => {
        events.push({
          id: `capa-${c.id}`,
          title: `${t("capa")} - ${c.description.substring(0, 20)}...`,
          date: c.dueDate,
          type: "CAPA",
          color: eventTypeColors.CAPA,
          link: { view: "risk" },
        });
      });

    // Custom events
    customEvents.forEach((e) => {
      events.push({
        id: e.id,
        title: e.title[lang as Language],
        date: e.date,
        type: "Custom",
        color: eventTypeColors.Custom,
        description: e.description?.[lang as Language],
      });
    });

    return events;
  }, [projects, documents, customEvents, t, lang]);

  const handleEventSave = (
    event: Omit<CustomCalendarEvent, "id" | "type">,
    id?: string
  ) => {
    if (id) {
      updateCustomEvent({ ...event, id, type: "Custom" });
    } else {
      addCustomEvent(event);
    }
    setIsEventModalOpen(false);
  };

  const handleEventDelete = (id: string) => {
    deleteCustomEvent(id);
    setIsEventModalOpen(false);
  };

  const openDayDetail = (day: number) => {
    setSelectedDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    setIsDayDetailModalOpen(true);
  };

  const openEventModalForDate = (date: Date) => {
    setEventToEdit(null);
    setSelectedDate(date);
    setIsEventModalOpen(true);
    setIsDayDetailModalOpen(false);
  };

  const openEventModalForEdit = (event: UnifiedEvent) => {
    if (event.type === "Custom") {
      const customEvent = customEvents.find((e) => e.id === event.id);
      if (customEvent) {
        setEventToEdit(customEvent);
        setSelectedDate(new Date(customEvent.date));
        setIsEventModalOpen(true);
        setIsDayDetailModalOpen(false);
      }
    } else if (event.link) {
      setNavigation(event.link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
        <CalendarDaysIcon className="h-8 w-8 text-brand-primary" />
        <div>
          <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">
            {t("complianceCalendar")}
          </h1>
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">
            {t("calendarPageDescription")}
          </p>
        </div>
      </div>
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-lg shadow-sm border border-brand-border dark:border-dark-brand-border p-4">
        <CalendarHeader
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          view={view}
          setView={setView}
          onAddEvent={() => {
            setEventToEdit(null);
            setSelectedDate(new Date());
            setIsEventModalOpen(true);
          }}
        />
        <div className="mt-4">
          {view === "month" && (
            <CalendarGrid
              currentDate={currentDate}
              events={unifiedEvents}
              onDayClick={openDayDetail}
              onEventClick={openEventModalForEdit}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={unifiedEvents}
              onEventClick={openEventModalForEdit}
            />
          )}
          {view === "year" && (
            <YearView
              currentDate={currentDate}
              events={unifiedEvents}
              setCurrentDate={setCurrentDate}
              setView={setView}
            />
          )}
        </div>
      </div>

      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSave={handleEventSave}
          onDelete={handleEventDelete}
          selectedDate={selectedDate}
          eventToEdit={eventToEdit}
        />
      )}
      {isDayDetailModalOpen && (
        <DayDetailModal
          isOpen={isDayDetailModalOpen}
          onClose={() => setIsDayDetailModalOpen(false)}
          date={selectedDate}
          events={unifiedEvents.filter(
            (e) =>
              new Date(e.date).toDateString() === selectedDate.toDateString()
          )}
          onAddEvent={() => openEventModalForDate(selectedDate)}
          onEventClick={openEventModalForEdit}
        />
      )}
    </div>
  );
};

export default CalendarPage;
