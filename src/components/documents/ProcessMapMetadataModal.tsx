import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAppStore } from '@/stores/useAppStore';
import { XMarkIcon } from '../icons';

interface ProcessMapMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    name: { en: string; ar: string },
    tags?: string[],
    category?: string,
    departmentIds?: string[]
  }) => void;
}

const ProcessMapMetadataModal: React.FC<ProcessMapMetadataModalProps> = ({ isOpen, onClose, onSave }) => {
    const { t, dir, lang } = useTranslation();
    const { departments } = useAppStore();
    const [nameEn, setNameEn] = useState('');
    const [nameAr, setNameAr] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [category, setCategory] = useState('');
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Save process map with metadata
        onSave({ 
            name: { en: nameEn, ar: nameAr },
            tags: tags.length > 0 ? tags : undefined,
            category: category || undefined,
            departmentIds: selectedDepartments.length > 0 ? selectedDepartments : undefined
        });
        
        // Reset form
        setNameEn('');
        setNameAr('');
        setTags([]);
        setTagInput('');
        setCategory('');
        setSelectedDepartments([]);
        onClose();
    };

    const handleClose = () => {
        setNameEn('');
        setNameAr('');
        setTags([]);
        setTagInput('');
        setCategory('');
        setSelectedDepartments([]);
        onClose();
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const toggleDepartment = (deptId: string) => {
        if (selectedDepartments.includes(deptId)) {
            setSelectedDepartments(selectedDepartments.filter(id => id !== deptId));
        } else {
            setSelectedDepartments([...selectedDepartments, deptId]);
        }
    };

    if (!isOpen) return null;
    
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center backdrop-blur-sm modal-enter"
        onClick={handleClose}
      >
        <div
          className="bg-white dark:bg-dark-brand-surface rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto modal-content-enter"
          onClick={(e) => e.stopPropagation()}
          dir={dir}
        >
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <h3 className="text-lg font-medium">
                {t("addNewProcessMap") || "Add New Process Map"}
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium">
                    {t("processMapNameEn") || "Process Map Name (English)"}
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                    required
                    placeholder={
                      t("exampleProcessName") ||
                      "e.g., Patient Registration Process"
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    {t("processMapNameAr") || "Process Map Name (Arabic)"}
                  </label>
                  <input
                    type="text"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                    dir="rtl"
                    required
                    placeholder={
                      t("exampleProcessNameAr") || "مثال: عملية تسجيل المرضى"
                    }
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium">
                    {t("category") || "Category"} ({t("optional") || "Optional"}
                    )
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                  >
                    <option value="">
                      {t("selectCategory") || "Select Category"}
                    </option>
                    <option value="Quality Management">
                      {t("qualityManagement") || "Quality Management"}
                    </option>
                    <option value="Safety">{t("safety") || "Safety"}</option>
                    <option value="Operations">
                      {t("operations") || "Operations"}
                    </option>
                    <option value="Human Resources">
                      {t("humanResources") || "Human Resources"}
                    </option>
                    <option value="Finance">{t("finance") || "Finance"}</option>
                    <option value="IT">
                      {t("informationTechnology") || "Information Technology"}
                    </option>
                    <option value="Compliance">
                      {t("compliance") || "Compliance"}
                    </option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("tags") || "Tags"} ({t("optional") || "Optional"})
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t("addTag") || "Add tag..."}
                      className="flex-1 border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      {t("add") || "Add"}
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-blue-900 dark:hover:text-blue-200"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Departments */}
                {departments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("departments") || "Departments"} (
                      {t("optional") || "Optional"})
                    </label>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-md p-3 max-h-40 overflow-y-auto bg-white dark:bg-gray-800">
                      {departments.map((dept) => (
                        <label
                          key={dept.id}
                          className="flex items-center space-x-2 rtl:space-x-reverse py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDepartments.includes(dept.id)}
                            onChange={() => toggleDepartment(dept.id)}
                            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {dept.name[lang] || dept.name.en}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                className="py-2 px-4 border rounded-md text-sm text-white bg-brand-primary hover:bg-sky-700 transition-colors"
              >
                {t("create") || "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
}

export default ProcessMapMetadataModal;
