import React, { useState } from 'react';
import { ChecklistItem, User } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface ChecklistCommentsProps {
    item: ChecklistItem;
    currentUser: User;
    onAddComment: (commentText: string) => void;
}

const ChecklistComments: React.FC<ChecklistCommentsProps> = ({ item, currentUser, onAddComment }) => {
    const { t } = useTranslation();
    const [commentText, setCommentText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            onAddComment(commentText.trim());
            setCommentText('');
        }
    };
    
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{t('comments')}</label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {item.comments.map(comment => (
                    <div key={comment.id} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                        <p><span className="font-semibold">{comment.userName}</span>: {comment.text}</p>
                        <p className="text-xs text-gray-400">{new Date(comment.timestamp).toLocaleString()}</p>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
                <input 
                    type="text" 
                    value={commentText} 
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={t('addComment') + '...'}
                    className="w-full text-sm p-2 border rounded-md" 
                />
                <button type="submit" className="px-4 py-2 text-sm bg-brand-primary text-white rounded-md">{t('save')}</button>
            </form>
        </div>
    );
};

export default ChecklistComments;