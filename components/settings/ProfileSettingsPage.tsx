import React, { useState, FormEvent } from 'react';
import { User } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import SettingsCard from './SettingsCard';
import { useToast } from '../../hooks/useToast';
import { useUserStore } from '../../stores/useUserStore';

const ProfileSettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const { currentUser, updateUser: onUpdateUser } = useUserStore();
    
    const [name, setName] = useState(currentUser!.name);
    const [password, setPassword] = useState('');
    
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const inputClasses = "mt-1 w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-gray-700 dark:text-white";

    const handleProfileUpdate = (e: FormEvent) => {
        e.preventDefault();
        const updatedUser = { ...currentUser!, name };
        if (password) updatedUser.password = password;
        onUpdateUser(updatedUser);
        setPassword('');
        toast.success(t('profileUpdated'));
    };

    if (!currentUser) return null;

    return (
        <form onSubmit={handleProfileUpdate}>
            <SettingsCard title={t('profile')} description={t('profileDescription')} footer={<button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-indigo-700">{t('updateProfile')}</button>}>
                <div>
                    <label htmlFor="name" className={labelClasses}>{t('userName')}</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="email" className={labelClasses}>{t('userEmail')}</label>
                    <input type="email" id="email" value={currentUser.email} readOnly className={`${inputClasses} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} />
                </div>
                <div>
                    <label htmlFor="password" className={labelClasses}>{t('password')}</label>
                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('passwordPlaceholder')} className={inputClasses} />
                </div>
            </SettingsCard>
        </form>
    );
};

export default ProfileSettingsPage;