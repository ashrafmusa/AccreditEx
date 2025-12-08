import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/useToast';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  SpinnerIcon,
  PlusIcon,
  TrashIcon,
  DownloadIcon,
  UploadIcon,
  MagnifyingGlassIcon,
  PencilIcon,
} from '@/components/icons';
import {
  CollectionInfo,
  getAllCollectionsInfo,
  createCollection,
  deleteCollection,
  deleteDocument,
  exportCollection,
  searchCollectionDocuments,
  getDocumentPreview,
  getCollectionStatistics,
  getFullDocument,
} from '@/services/firebaseSetupService';
import DocumentEditor from './DocumentEditor';
import CreateDocumentModal from './CreateDocumentModal';

const MONITORED_COLLECTIONS = [
  'appSettings',
  'users',
  'projects',
  'documents',
  'audits',
  'risks',
  'departments',
];

interface CollectionStats {
  documentCount: number;
  averageDocumentSize: number;
  fieldCount: number;
}

export const EnhancedCollectionsManager: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [collectionStats, setCollectionStats] = useState<Record<string, CollectionStats>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());
  
  // New state for document editing
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingDocumentData, setEditingDocumentData] = useState<any>(null);
  const [showCreateDocumentModal, setShowCreateDocumentModal] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const collectionsList = await getAllCollectionsInfo();
      setCollections(collectionsList);

      // Load statistics for each collection
      const stats: Record<string, CollectionStats> = {};
      for (const col of collectionsList) {
        try {
          const colStats = await getCollectionStatistics(col.name);
          stats[col.name] = {
            documentCount: colStats.documentCount,
            averageDocumentSize: colStats.averageDocumentSize,
            fieldCount: colStats.fieldCount,
          };
        } catch (error) {
          console.error(`Error loading stats for ${col.name}:`, error);
        }
      }
      setCollectionStats(stats);
    } catch (error) {
      toast.error(t('collections') + ' ' + t('error'));
      console.error('Error loading collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (collectionName: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchCollectionDocuments(collectionName, searchTerm);
      setSearchResults(results);
      if (results.length === 0) {
        toast.info(t('noResults'));
      }
    } catch (error) {
      toast.error(t('searchFailed'));
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportCollection = async (collectionName: string) => {
    try {
      const backup = await exportCollection(collectionName);
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collectionName}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('exportSuccess'));
    } catch (error) {
      toast.error(t('exportFailed'));
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error(t('collectionNameRequired'));
      return;
    }

    try {
      await createCollection(newCollectionName, { initialized: true });
      toast.success(t('collectionCreated'));
      setNewCollectionName('');
      setShowCreateForm(false);
      await loadCollections();
    } catch (error) {
      toast.error(t('createCollectionFailed'));
    }
  };

  const handleDeleteDocument = async (collectionName: string, docId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      await deleteDocument(collectionName, docId);
      toast.success(t('documentDeleted'));
      handleSearch(collectionName); // Refresh search results
    } catch (error) {
      toast.error(t('deleteDocumentFailed'));
    }
  };

  const handleEditDocument = async (collectionName: string, docId: string) => {
    try {
      const fullData = await getFullDocument(collectionName, docId);
      setEditingDocumentData(fullData);
      setEditingDocumentId(docId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load document');
      console.error('Error loading document:', error);
    }
  };

  const handleDocumentSaved = async () => {
    if (selectedCollection) {
      setEditingDocumentId(null);
      setEditingDocumentData(null);
      // Refresh search results
      handleSearch(selectedCollection);
    }
  };

  const toggleExpandCollection = (collectionName: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionName)) {
      newExpanded.delete(collectionName);
    } else {
      newExpanded.add(collectionName);
      setSelectedCollection(collectionName);
      setSearchTerm('');
      setSearchResults([]);
    }
    setExpandedCollections(newExpanded);
  };

  const getStatusColor = (collection: CollectionInfo) => {
    if (!collection.exists) return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
    if (collection.documentCount === 0) return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700';
    return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
  };

  const getStatusLabel = (collection: CollectionInfo) => {
    if (!collection.exists) return t('missing');
    if (collection.documentCount === 0) return t('empty');
    return t('active');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerIcon className="w-8 h-8 animate-spin text-brand-primary" />
        <span className="ml-3 text-brand-text-secondary">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Collection Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold hover:text-blue-800 dark:hover:text-blue-200"
        >
          <PlusIcon className="w-5 h-5" />
          {t('createNewCollection')}
        </button>

        {showCreateForm && (
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder={t('collectionName')}
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateCollection}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                {t('create')}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Collections List */}
      <div className="space-y-3">
        {collections.map((collection) => (
          <div
            key={collection.name}
            className={`border rounded-lg overflow-hidden transition ${getStatusColor(collection)}`}
          >
            {/* Collection Header */}
            <button
              onClick={() => toggleExpandCollection(collection.name)}
              className="w-full px-4 py-4 flex items-center justify-between hover:opacity-80 transition"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <DocumentTextIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {collection.documentCount} {t('documents')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    collection.exists
                      ? collection.documentCount > 0
                        ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}
                >
                  {getStatusLabel(collection)}
                </span>

                {expandedCollections.has(collection.name) && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportCollection(collection.name);
                      }}
                      className="p-2 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-blue-600 dark:text-blue-400"
                      title={t('export')}
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </button>

            {/* Expanded Collection Details */}
            {expandedCollections.has(collection.name) && (
              <div className="border-t border-gray-300 dark:border-gray-600 px-4 py-4 space-y-4 bg-white/50 dark:bg-gray-900/30">
                {/* Statistics */}
                {collectionStats[collection.name] && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-brand-primary">
                        {collectionStats[collection.name].documentCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t('documents')}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-center">
                      <div className="text-2xl font-bold text-brand-primary">
                        {collectionStats[collection.name].fieldCount}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t('fields')}
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded text-center">
                      <div className="text-sm font-bold text-brand-primary">
                        {collectionStats[collection.name].averageDocumentSize}B
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {t('avgSize')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('searchDocuments')}
                    </label>
                    <button
                      onClick={() => setShowCreateDocumentModal(true)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                    >
                      <PlusIcon className="w-3 h-3" />
                      {t('createNew')}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                    <button
                      onClick={() => handleSearch(collection.name)}
                      disabled={isSearching}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm font-medium"
                    >
                      {isSearching ? (
                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                      ) : (
                        <MagnifyingGlassIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t('foundResults')}: {searchResults.length}
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {searchResults.map((result) => (
                        <div
                          key={result.docId}
                          className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm border border-gray-300 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <code className="font-mono text-xs text-blue-600 dark:text-blue-400 break-all">
                              {result.docId}
                            </code>
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  handleEditDocument(collection.name, result.docId)
                                }
                                className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded text-blue-600 dark:text-blue-400"
                                title="Edit document"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteDocument(collection.name, result.docId)
                                }
                                className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded text-red-600 dark:text-red-400"
                                title={t('delete')}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {result.matchedFields && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {t('matchedFields')}: {result.matchedFields.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Data */}
                {collection.sample && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t('sampleData')}
                    </h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-x-auto border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      {JSON.stringify(collection.sample, null, 2).slice(0, 200)}...
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-brand-surface dark:bg-dark-brand-surface border border-brand-border dark:border-dark-brand-border p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          {t('summary')}
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('totalCollections')}:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {collections.length}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('totalDocuments')}:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              {collections.reduce((sum, col) => sum + col.documentCount, 0)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('activeCollections')}:</span>
            <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
              {collections.filter((col) => col.exists && col.documentCount > 0).length}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('emptyCollections')}:</span>
            <span className="ml-2 font-semibold text-yellow-600 dark:text-yellow-400">
              {collections.filter((col) => col.exists && col.documentCount === 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Document Editor Modal */}
      {editingDocumentId && editingDocumentData && selectedCollection && (
        <DocumentEditor
          collectionName={selectedCollection}
          documentId={editingDocumentId}
          initialData={editingDocumentData}
          onClose={() => {
            setEditingDocumentId(null);
            setEditingDocumentData(null);
          }}
          onSave={handleDocumentSaved}
        />
      )}

      {/* Create Document Modal */}
      {showCreateDocumentModal && selectedCollection && (
        <CreateDocumentModal
          collectionName={selectedCollection}
          existingIds={searchResults.map((r) => r.docId)}
          onClose={() => setShowCreateDocumentModal(false)}
          onSuccess={() => {
            setShowCreateDocumentModal(false);
            handleSearch(selectedCollection);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedCollectionsManager;
