import React, { FC } from "react";
import { useTranslation } from "../../hooks/useTranslation";
// FIX: Corrected import path for UnifiedEvent
import { UnifiedEvent } from "../../pages/CalendarPage";
import { XMarkIcon, PlusIcon } from "../icons";

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: UnifiedEvent[];
  onAddEvent: () => void;
  onEventClick: (event: UnifiedEvent) => void;
}

const DayDetailModal: FC<DayDetailModalProps> = ({
  isOpen,
  onClose,
  date,
  events,
  onAddEvent,
  onEventClick,
}) => {
  const { t, lang } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-md m-4 modal-content-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b dark:border-dark-brand-border flex justify-between items-center">
          <h3 className="font-semibold">
            {date.toLocaleDateString(lang === "ar" ? "ar-OM" : "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={t("close")}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </header>
        <div className="p-4 max-h-96 overflow-y-auto space-y-2">
          {events.length > 0 ? (
            events.map((event) => (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`w-full text-left p-2 rounded-md ${event.color} text-white text-sm`}
              >
                <p className="font-semibold">{event.title}</p>
                {event.description && (
                  <p className="text-xs opacity-80">{event.description}</p>
                )}
              </button>
            ))
          ) : (
            <p className="text-sm text-center text-gray-500 py-8">
              {t("noEventsForDay")}
            </p>
          )}
        </div>
        <footer className="p-4 border-t dark:border-dark-brand-border flex justify-end">
          <button
            onClick={onAddEvent}
            className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            {t("createEvent")}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default DayDetailModal;
