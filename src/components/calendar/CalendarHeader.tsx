import React from "react";
import { useTranslation } from "../../hooks/useTranslation";
// FIX: Corrected import path for CalendarView
import { CalendarView } from "../../pages/CalendarPage";
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from "../icons";

interface CalendarHeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  onAddEvent: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  setCurrentDate,
  view,
  setView,
  onAddEvent,
}) => {
  const { t, lang } = useTranslation();

  const changeMonth = (offset: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1),
    );
  };

  const changeYear = (offset: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear() + offset, currentDate.getMonth(), 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const viewOptions: { id: CalendarView; label: string }[] = [
    { id: "month", label: t("month") },
    { id: "agenda", label: t("agenda") },
    { id: "year", label: t("year") },
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={goToToday}
          className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {t("today")}
        </button>
        <div className="flex items-center">
          <button
            onClick={() => (view === "year" ? changeYear(-1) : changeMonth(-1))}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={t("previousMonth")}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="font-semibold w-36 text-center">
            {view === "year"
              ? currentDate.getFullYear()
              : currentDate.toLocaleString(lang === "ar" ? "ar-OM" : "en-US", {
                  month: "long",
                  year: "numeric",
                })}
          </span>
          <button
            onClick={() => (view === "year" ? changeYear(1) : changeMonth(1))}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={t("nextMonth")}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setView(option.id)}
              className={`px-3 py-1 text-sm font-semibold rounded-md ${view === option.id ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          onClick={onAddEvent}
          className="bg-brand-primary text-white p-2 rounded-lg hover:bg-sky-700"
          aria-label={t("createEvent")}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
