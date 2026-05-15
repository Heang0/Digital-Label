"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Tag, Edit, Trash2, Plus } from 'lucide-react';
import { createCategory, updateCategory, deleteCategory } from '@/lib/categories';
import { Timestamp } from 'firebase/firestore';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  companyId: string;
  createdAt: Timestamp;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  category?: Category | null;
  onCategoryChange: () => void;
}

const DEFAULT_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
];

export default function CategoryModal({ 
  isOpen, 
  onClose, 
  companyId, 
  category,
  onCategoryChange 
}: CategoryModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0].value,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color || DEFAULT_COLORS[0].value,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0].value,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !companyId) return;

    setLoading(true);
    try {
      const trimmedName = formData.name.trim();
      const trimmedDescription = formData.description.trim();
      const payload = {
        name: trimmedName,
        color: formData.color,
        ...(trimmedDescription ? { description: trimmedDescription } : {})
      };

      if (category?.id) {
        await updateCategory(category.id, payload);
      } else {
        await createCategory(companyId, payload);
      }

      onCategoryChange();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category?.id || !confirm(`${t('delete')} "${category.name}"?`)) return;

    setLoading(true);
    try {
      await deleteCategory(category.id);
      onCategoryChange();
      onClose();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1C2434] rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111928] dark:text-white">
                  {category ? t('edit_category') : t('new_category')}
                </h2>
                <p className="text-[10px] font-bold text-[#637381] uppercase tracking-widest mt-0.5">{t('inventory_classification')}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('category_name')} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('category_name_placeholder')}
                required
                disabled={loading}
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('category_desc')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 h-24 text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white"
                placeholder={t('category_desc_placeholder')}
                disabled={loading}
              />
            </div>

            {/* Color */}
            <div className="space-y-3">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('identity_color')}
              </label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-9 w-9 rounded-xl border-2 transition-all ${formData.color === color.value ? 'border-[#5750F1] scale-110 shadow-lg shadow-current/10' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t">
            <div className="flex gap-2">
              {category && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete')}
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {category ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('update')}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('create')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
