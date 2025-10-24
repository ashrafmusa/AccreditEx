import React, { useState, FC, useEffect } from 'react';
import { CustomCalendarEvent } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { TrashIcon } from '../icons';
import DatePicker from '../ui/DatePicker';
import Modal from '../ui/Modal';
import { inputClasses, labelClasses } from '../ui/constants';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<CustomCalendarEvent, 'id' | 'type'>, id?: string) => void;
  onDelete: (id: string) => void;
  selectedDate: Date;
  eventToEdit: CustomCalendarEvent | null;
}

const EventModal: FC<EventModalProps> = ({ isOpen, onClose, onSave, onDelete, selectedDate, eventToEdit }) => {
    const { t } = useTranslation();
    const isEditMode = !!eventToEdit;

    const [titleEn, setTitleEn] = useState('');
    const [titleAr, setTitleAr] = useState('');
    const [descriptionEn, setDescriptionEn] = useState('');
    const [descriptionAr, setDescriptionAr] = useState('');
    const [date, setDate] = useState<Date | undefined>();

    useEffect(() => {
        if(eventToEdit) {
            setTitleEn(eventToEdit.title.en);
            setTitleAr(eventToEdit.title.ar);
            setDescriptionEn(eventToEdit.description?.en || '');
            setDescriptionAr(eventToEdit.description?.ar || '');
            setDate(new Date(eventToEdit.date));
        } else {
            setTitleEn('');
            setTitleAr('');
            setDescriptionEn('');
            setDescriptionAr('');
            setDate(selectedDate);
        }
    }, [eventToEdit, selectedDate, isOpen]);
    

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!titleEn || !titleAr || !date) return;
        onSave({
            date: date.toISOString().split('T')[0],
            title: { en: titleEn, ar: titleAr },
            description: { en: descriptionEn, ar: descriptionAr },
        }, eventToEdit?.id);
    }
    
    const footer = (
        <div className="w-full flex justify-between items-center">
            <div>
                {isEditMode && (
                    <button type="button" onClick={() => onDelete(eventToEdit.id)} className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"><TrashIcon className="w-4 h-4" />{t('delete')}</button>
                )}
            </div>
            <div className="flex justify-end space-x-3 rtl:space-x-reverse">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 py-2 px-4 border border-gray-300 dark:border-gray-500 rounded-md text-sm">{t('cancel')}</button>
                <button type="submit" form="event-form" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700">{t('save')}</button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? t('editEvent') : t('createEvent')} footer={footer}>
            <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="date" className={labelClasses}>{t('eventDate')}</label>
                    <DatePicker date={date} setDate={setDate} />
                </div>
                <div><label htmlFor="titleEn" className={labelClasses}>{t('eventTitleEn')}</label><input type="text" value={titleEn} onChange={e => setTitleEn(e.target.value)} id="titleEn" className={inputClasses} required /></div>
                <div><label htmlFor="titleAr" className={labelClasses}>{t('eventTitleAr')}</label><input type="text" value={titleAr} onChange={e => setTitleAr(e.target.value)} id="titleAr" className={inputClasses} required dir="rtl" /></div>
                <div><label htmlFor="descEn" className={labelClasses}>{t('eventDescriptionEn')}</label><textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} id="descEn" rows={2} className={inputClasses} /></div>
                <div><label htmlFor="descAr" className={labelClasses}>{t('eventDescriptionAr')}</label><textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} id="descAr" rows={2} className={inputClasses} dir="rtl"/></div>
            </form>
        </Modal>
    );
};

export default EventModal;