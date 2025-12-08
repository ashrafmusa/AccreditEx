import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
  fromDate?: Date;
  toDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({ date, setDate, disabled, fromDate, toDate }) => {
  const { t, lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(date || new Date());
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleSelect = (selectedDate: Date) => {
    setDate(selectedDate);
    setIsOpen(false);
  };

  const changeMonth = (offset: number) => {
    setDisplayDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const startDayOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
  const daysOfWeek = lang === 'ar' 
    ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:cursor-not-allowed flex justify-between items-center"
      >
        <span>
          {date ? date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : <span className="text-gray-400">{t('selectDate')}</span>}
        </span>
        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-2 bg-white dark:bg-dark-brand-surface rounded-md shadow-lg border border-gray-200 dark:border-dark-brand-border p-3">
          <div className="flex justify-between items-center mb-2">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5"/></button>
            <span className="font-semibold text-sm">{displayDate.toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-US', { month: 'long', year: 'numeric' })}</span>
            <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5"/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500">
            {daysOfWeek.map(day => <div key={day} className="w-8 h-8 flex items-center justify-center">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-1">
            {Array.from({ length: startDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
              const dayNumber = dayIndex + 1;
              const dayDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), dayNumber);
              const isSelected = date?.toDateString() === dayDate.toDateString();
              const isToday = new Date().toDateString() === dayDate.toDateString();
              const isDisabled = (fromDate && dayDate < fromDate) || (toDate && dayDate > toDate);
              
              let classes = "w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ";
              if (isDisabled) {
                classes += "text-gray-400 cursor-not-allowed";
              } else if (isSelected) {
                classes += "bg-brand-primary text-white font-bold";
              } else if (isToday) {
                classes += "bg-indigo-100 dark:bg-indigo-900/50 text-brand-primary";
              } else {
                classes += "hover:bg-gray-100 dark:hover:bg-gray-700";
              }

              return (
                <button
                  key={dayNumber}
                  type="button"
                  onClick={() => handleSelect(dayDate)}
                  disabled={isDisabled}
                  className={classes}
                >
                  {dayNumber}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;