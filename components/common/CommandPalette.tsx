import React, { useState, useEffect, useMemo, FC, Fragment } from 'react';
import { Project, User, AppDocument, Standard, AccreditationProgram, NavigationState } from '../types';
import { useTranslation } from '../../hooks/useTranslation';
import { MagnifyingGlassIcon } from '../icons';

interface CommandPaletteProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  setNavigation: (state: NavigationState) => void;
  projects: Project[];
  users: User[];
  documents: AppDocument[];
  standards: Standard[];
  programs: AccreditationProgram[];
}

const CommandPalette: FC<CommandPaletteProps> = ({ isOpen, setIsOpen, setNavigation, projects, users, documents, standards, programs }) => {
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, setIsOpen]);

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];

    const lowerSearch = searchTerm.toLowerCase();

    const staticResults = [
        { name: t('userManagement'), link: () => setNavigation({ view: 'settings', section: 'users'}) },
        { name: t('accreditationHub'), link: () => setNavigation({ view: 'settings', section: 'accreditationHub'}) }
    ]
    .filter(p => p.name.toLowerCase().includes(lowerSearch))
    .map(p => ({ type: t('settings'), ...p }));


    const projectResults = projects
      .filter(p => p.name.toLowerCase().includes(lowerSearch))
      .map(p => ({ type: t('projects'), name: p.name, link: () => setNavigation({ view: 'projectDetail', projectId: p.id }) }));
    
    const userResults = users
      .filter(u => u.name.toLowerCase().includes(lowerSearch))
      .map(u => ({ type: t('users'), name: u.name, link: () => setNavigation({ view: 'settings', section: 'users' }) }));

    const documentResults = documents
      .filter(d => d.name[lang]?.toLowerCase().includes(lowerSearch))
      .map(d => ({ type: t('documents'), name: d.name[lang], link: () => {} /* Need project context */ }));

    const standardResults = standards
      .filter(s => s.standardId.toLowerCase().includes(lowerSearch) || s.description.toLowerCase().includes(lowerSearch))
      .map(s => {
          const program = programs.find(p => p.id === s.programId);
          return { type: t('standardsLibrary'), name: `${s.standardId}: ${s.description.substring(0,30)}...`, link: () => setNavigation({ view: 'standards', programId: s.programId }) }
      });

    const combined = [...staticResults, ...projectResults, ...userResults, ...documentResults, ...standardResults];
    
    return combined.reduce((acc, item) => {
        let group = acc.find(g => g.type === item.type);
        if(!group) {
            group = { type: item.type, items: [] };
            acc.push(group);
        }
        group.items.push(item);
        return acc;
    }, [] as { type: string; items: typeof projectResults }[]);

  }, [searchTerm, projects, users, documents, standards, programs, lang, setNavigation, t]);
  
  const handleItemClick = (link: () => void) => {
    link();
    setSearchTerm('');
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-20" onClick={() => setIsOpen(false)}>
      <div className="bg-brand-surface dark:bg-dark-brand-surface rounded-xl shadow-2xl w-full max-w-xl mx-4" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute top-3.5 left-4 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('searchAnything')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-transparent px-12 py-3 border-b border-brand-border dark:border-dark-brand-border focus:outline-none"
            autoFocus
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {searchTerm && searchResults.length === 0 && (
            <p className="text-center text-sm text-gray-500 p-4">{t('noResults')}</p>
          )}
          {searchResults.map(group => (
            <div key={group.type}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase px-3 pt-3 pb-1">{group.type}</h3>
              <ul>
                {group.items.map((item, index) => (
                  <li key={`${group.type}-${index}`}>
                    <button onClick={() => handleItemClick(item.link)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-brand-border dark:border-dark-brand-border text-xs text-gray-400">
          <strong>{t('goTo')}:</strong> {t('projects')}, {t('users')}, {t('documents')}, {t('standardsLibrary')}...
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;