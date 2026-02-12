import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
// FIX: Corrected import paths for UnifiedEvent and CalendarView
import { UnifiedEvent, CalendarView } from '../../pages/CalendarPage';

interface YearViewProps {
  currentDate: Date;
  events: UnifiedEvent[];
  setCurrentDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
}

const YearView: React.FC<YearViewProps> = ({ currentDate, events, setCurrentDate, setView }) => {
    const { t, lang } = useTranslation();
    const year = currentDate.getFullYear();

    const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
    const daysOfWeek = lang === 'ar' 
        ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
        : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const getMonthEvents = (month: number) => {
        return events.filter(e => {
            const eventDate = new Date(e.date);
            return eventDate.getFullYear() === year && eventDate.getMonth() === month;
        });
    };

    const handleMonthClick = (month: number) => {
        setCurrentDate(new Date(year, month, 1));
        setView('month');
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {months.map((monthDate, index) => {
                const monthEvents = getMonthEvents(index);
                const eventDays = new Set(monthEvents.map(e => new Date(e.date).getDate()));
                
                const startDay = monthDate.getDay();
                const daysInMonth = new Date(year, index + 1, 0).getDate();

                return (
                    <div key={index} onClick={() => handleMonthClick(index)} className="p-3 border rounded-lg dark:border-dark-brand-border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <h4 className="font-semibold text-center text-sm text-brand-primary mb-2">
                            {monthDate.toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-US', { month: 'long' })}
                        </h4>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
                            {daysOfWeek.map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1 mt-1">
                            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                                const day = dayIndex + 1;
                                const hasEvent = eventDays.has(day);
                                return (
                                    <div key={day} className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${hasEvent ? 'bg-sky-200 dark:bg-sky-900/50' : ''}`}>
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default YearView;