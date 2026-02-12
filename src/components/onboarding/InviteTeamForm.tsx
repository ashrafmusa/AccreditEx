import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '@/hooks/useTranslation';
import { markStepComplete } from '@/utils/onboardingStorage';

interface InviteTeamFormProps {
  onInvite: (email: string) => void;
  onSkip: () => void;
}

export const InviteTeamForm: React.FC<InviteTeamFormProps> = ({ onInvite, onSkip }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    
    // Simulate sending invite
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onInvite(email);
    markStepComplete(4); // Mark step 5 (index 4) as complete
    setEmail('');
    setIsSubmitting(false);
  };

  const handleSkip = () => {
    markStepComplete(4); // Mark as complete even if skipped
    onSkip();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto my-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="inviteEmail" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t('teamMemberEmail')}
          </label>
          <input
            id="inviteEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('enterEmailPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
              bg-white dark:bg-slate-800 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-brand-primary focus:border-transparent
              transition-colors"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={!email.trim() || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <UserPlusIcon className="w-5 h-5" />
            <span>{isSubmitting ? t('sending') : t('sendInvite')}</span>
          </Button>
          
          <Button
            type="button"
            onClick={handleSkip}
            variant="ghost"
            className="flex-1"
          >
            {t('skipForNow')}
          </Button>
        </div>
      </form>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
        {t('inviteTeamLater')}
      </p>
    </motion.div>
  );
};

export default InviteTeamForm;
