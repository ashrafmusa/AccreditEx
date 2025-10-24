import React, { useState, useEffect, FC, useCallback, useMemo } from 'react';
import { ToastContext, ToastMessage, ToastContextType, ToastType } from '../../hooks/useToast';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '../icons';

const ICONS = {
    success: <CheckCircleIcon className="w-6 h-6 text-white" />,
    error: <XCircleIcon className="w-6 h-6 text-white" />,
    info: <InformationCircleIcon className="w-6 h-6 text-white" />,
};

const BG_COLORS = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
};

const Toast: FC<{ message: ToastMessage; onDismiss: (id: number) => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(message.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [message, onDismiss]);

    return (
        <div className={`flex items-center p-4 rounded-lg shadow-lg text-white ${BG_COLORS[message.type]}`}>
            <div className="flex-shrink-0">{ICONS[message.type]}</div>
            <div className="mx-3 text-sm font-medium">{message.message}</div>
            <button onClick={() => onDismiss(message.id)} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg inline-flex h-8 w-8 hover:bg-white/20">
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export const ToastProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((message: string) => addToast(message, 'success'), [addToast]);
    const error = useCallback((message: string) => addToast(message, 'error'), [addToast]);
    const info = useCallback((message: string) => addToast(message, 'info'), [addToast]);

    const contextValue = useMemo<ToastContextType>(() => ({
        success,
        error,
        info,
    }), [success, error, info]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className="fixed bottom-5 right-5 z-50 w-full max-w-xs space-y-4">
                {toasts.map(toast => (
                    <Toast key={toast.id} message={toast} onDismiss={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};