import React from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Hook that provides admin role verification for settings pages.
 * Returns isAdmin status, user info, and a guard wrapper.
 *
 * Usage:
 *   const { isAdmin, currentUser, AdminOnly } = useAdminGuard();
 *   return <AdminOnly fallbackMessage="Admin access required">{...}</AdminOnly>
 */
export function useAdminGuard() {
    const currentUser = useUserStore((state) => state.currentUser);
    const { t } = useTranslation();

    const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

    /** Wrapper component that renders children only for admins */
    const AdminOnly: React.FC<{
        children: React.ReactNode;
        fallbackMessage?: string;
    }> = ({ children, fallbackMessage }) => {
        if (isAdmin) return <>{ children } </>;
        return (
            <div className= "flex flex-col items-center justify-center py-12 text-center" >
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4" >
                <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill = "none" viewBox = "0 0 24 24" strokeWidth = { 1.5} stroke = "currentColor" >
                    <path strokeLinecap="round" strokeLinejoin = "round" d = "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        </div>
                        < h3 className = "text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-1" >
                            { t('adminAccessRequired') || 'Administrator Access Required'
    }
    </h3>
        < p className = "text-sm text-brand-text-secondary dark:text-dark-brand-text-secondary max-w-md" >
            { fallbackMessage || t('adminAccessDescription') || 'You need administrator privileges to access this section. Please contact your system administrator.'
}
</p>
    </div>
    );
  };

return { isAdmin, currentUser, AdminOnly };
}
