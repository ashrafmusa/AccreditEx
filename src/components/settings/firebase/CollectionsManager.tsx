import React, { useState, useEffect } from 'react';
import { CheckIcon, SpinnerIcon, ExclamationTriangleIcon } from '@/components/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { getAllCollectionsInfo, CollectionInfo } from '@/services/firebaseSetupService';

const CollectionsManager: React.FC = () => {
  const { t } = useTranslation();
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoading(true);
      try {
        const result = await getAllCollectionsInfo();
        setCollections(result);
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const getCollectionStatus = (collection: CollectionInfo) => {
    if (!collection.exists) {
      return { status: 'missing', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
    }
    if (collection.documentCount === 0) {
      return { status: 'empty', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' };
    }
    return { status: 'active', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
  };

  return (
    <div className="bg-brand-surface dark:bg-dark-brand-surface p-6 rounded-lg border border-brand-border dark:border-dark-brand-border">
      <h3 className="text-lg font-semibold text-brand-text-primary dark:text-dark-brand-text-primary mb-4">
        {t('collections')}
      </h3>

      {isLoading ? (
        <div className="flex items-center gap-3 py-8">
          <SpinnerIcon className="w-5 h-5 text-brand-primary animate-spin" />
          <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary">{t('loading')}...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((collection) => {
            const { status, color, bg } = getCollectionStatus(collection);
            return (
              <div key={collection.name} className={`p-4 rounded-lg border border-brand-border dark:border-dark-brand-border ${bg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-brand-text-primary dark:text-dark-brand-text-primary">
                      {collection.name}
                    </p>
                    <p className={`text-sm ${color}`}>
                      {collection.exists ? (
                        <>
                          {collection.documentCount} {collection.documentCount === 1 ? t('document') : t('documents')}
                        </>
                      ) : (
                        t('collectionNotFound')
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {collection.exists ? (
                      <CheckIcon className={`w-5 h-5 ${color}`} />
                    ) : (
                      <ExclamationTriangleIcon className={`w-5 h-5 ${color}`} />
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color} bg-opacity-10`}>
                      {t(status)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollectionsManager;
