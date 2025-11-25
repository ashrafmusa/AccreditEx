import React, { useState, useMemo } from 'react';
import { AppDocument, User, UserRole, Standard } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { DocumentTextIcon, PlusIcon, ChevronDownIcon, CheckCircleIcon, ClockIcon, PencilIcon } from '../components/icons';
import SignatureModal from '../components/common/SignatureModal';
import DocumentMetadataModal from '../components/documents/DocumentMetadataModal';
import ControlledDocumentsTable from '../components/documents/ControlledDocumentsTable';
// FIX: Corrected import path for DocumentEditorModal
import DocumentEditorModal from '../components/documents/DocumentEditorModal';
import ProcessMapEditor from '../components/documents/ProcessMapEditor';
import StatCard from '../components/common/StatCard';

interface DocumentControlHubPageProps {
  documents: AppDocument[];
  standards: Standard[];
  currentUser: User;
  onUpdateDocument: (updatedDocument: AppDocument) => void;
  onCreateDocument: (data: { name: { en: string; ar: string }, type: AppDocument['type'] }) => void;
  onAddProcessMap: (data: { name: { en: string; ar: string }}) => void;
  onDeleteDocument: (docId: string) => void;
  onApproveDocument: (docId: string, passwordAttempt: string) => void;
}

const DocumentControlHubPage: React.FC<DocumentControlHubPageProps> = ({ documents, standards, currentUser, onUpdateDocument, onCreateDocument, onAddProcessMap, onDeleteDocument, onApproveDocument }) => {
  const { t, lang } = useTranslation();
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [signingDoc, setSigningDoc] = useState<AppDocument | null>(null);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<AppDocument | null>(null);

  const canModify = currentUser.role === UserRole.Admin;
  
  const handleConfirmSignature = (password: string) => {
    if (signingDoc) {
      onApproveDocument(signingDoc.id, password);
      setSigningDoc(null);
    }
  };

  const handleSaveDocument = (doc: AppDocument) => {
    onUpdateDocument(doc);
    setViewingDoc(null);
  }

  const controlledDocuments = useMemo(() => {
    return documents.filter(doc => doc.isControlled);
  }, [documents]);

  const stats = useMemo(() => {
    return {
      total: controlledDocuments.length,
      approved: controlledDocuments.filter(d => d.status === 'Approved').length,
      pending: controlledDocuments.filter(d => d.status === 'Pending Review').length,
      drafts: controlledDocuments.filter(d => d.status === 'Draft').length,
    }
  }, [controlledDocuments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-3 rtl:space-x-reverse self-start">
          <DocumentTextIcon className="h-8 w-8 text-brand-primary" />
          <div>
            <h1 className="text-3xl font-bold dark:text-dark-brand-text-primary">{t('documentControl')}</h1>
            <p className="text-brand-text-secondary dark:text-dark-brand-text-secondary mt-1">{t('documentControlHubDescription')}</p>
          </div>
        </div>
        {canModify && (
            <div className="relative">
                <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className="bg-brand-primary text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center justify-center font-semibold shadow-sm w-full md:w-auto">
                    <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />{t('addNew')} <ChevronDownIcon className="w-4 h-4 ltr:ml-2 rtl:mr-2"/>
                </button>
                {isAddMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-dark-brand-surface rounded-md shadow-lg border dark:border-dark-brand-border z-10">
                        <button onClick={() => {setIsMetaModalOpen(true); setIsAddMenuOpen(false);}} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">{t('policy')}/{t('procedure')}</button>
                        <button onClick={() => { onAddProcessMap({ name: { en: 'New Process Map', ar: 'خريطة عملية جديدة'}}); setIsAddMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">{t('processMap')}</button>
                    </div>
                )}
            </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title={t('totalDocuments')} value={stats.total} icon={DocumentTextIcon} color="from-blue-500 to-blue-700 bg-gradient-to-br" />
          <StatCard title={t('approved')} value={stats.approved} icon={CheckCircleIcon} color="from-green-500 to-green-700 bg-gradient-to-br" />
          <StatCard title={t('pendingReview')} value={stats.pending} icon={ClockIcon} color="from-yellow-500 to-yellow-700 bg-gradient-to-br" />
          <StatCard title={t('drafts')} value={stats.drafts} icon={PencilIcon} color="from-gray-500 to-gray-700 bg-gradient-to-br" />
      </div>

      <ControlledDocumentsTable
        documents={controlledDocuments}
        canModify={canModify}
        onApprove={(doc) => setSigningDoc(doc)}
        onDelete={onDeleteDocument}
        onView={setViewingDoc}
      />

      <DocumentMetadataModal isOpen={isMetaModalOpen} onClose={() => setIsMetaModalOpen(false)} onSave={onCreateDocument} />
      
      {signingDoc && (
        <SignatureModal 
            isOpen={!!signingDoc} 
            onClose={() => setSigningDoc(null)} 
            onConfirm={handleConfirmSignature} 
            actionTitle={`${t('approve')} "${signingDoc.name[lang]}"`} 
            signatureStatement={t('signatureStatementDocument')} 
            confirmActionText={t('signAndApprove')} 
        />
      )}

      {viewingDoc && viewingDoc.type !== 'Process Map' && (
        <DocumentEditorModal 
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc}
          onSave={handleSaveDocument}
          standards={standards}
        />
      )}

      {viewingDoc && viewingDoc.type === 'Process Map' && (
        <ProcessMapEditor
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc}
          onSave={handleSaveDocument}
        />
      )}
    </div>
  );
};

export default DocumentControlHubPage;