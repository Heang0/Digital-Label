"use client";

import { useState } from 'react';
import { Plus, Tag, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

interface CategoryManagerProps {
  companyId: string;
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

const DEFAULT_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
];

export default function CategoryManager({ 
  companyId, 
  categories, 
  onCategoriesChange 
}: CategoryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DEFAULT_COLORS[0].value,
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      // Update existing category
      const updated = categories.map(cat =>
        cat.id === editingId ? { ...cat, ...formData } : cat
      );
      onCategoriesChange(updated);
      setEditingId(null);
    } else {
      // Add new category
      const newCategory: Category = {
        id: `cat_${Date.now()}`,
        ...formData,
      };
      onCategoriesChange([...categories, newCategory]);
    }

    // Reset form
    setFormData({
      name: '',
      description: '',
      color: DEFAULT_COLORS[0].value,
    });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this category? Products using it will keep it as text.')) {
      const updated = categories.filter(cat => cat.id !== id);
      onCategoriesChange(updated);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || DEFAULT_COLORS[0].value,
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      {/* Categories List */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {categories.map(category => (
          <div
            key={category.id}
            className="border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: category.color }}
              >
                <Tag className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="font-medium">{category.name}</div>
                {category.description && (
                  <div className="text-xs text-gray-500">{category.description}</div>
                )}
              </div>
            </div>
            
            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(category)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="p-1 hover:bg-red-100 rounded text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm ? (
        <div className="border rounded-xl p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">
              {editingId ? 'Edit Category' : 'New Category'}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setFormData({ name: '', description: '', color: DEFAULT_COLORS[0].value });
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Category Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Dairy, Beverages, Fresh Produce"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-8 w-8 rounded-lg border-2 ${formData.color === color.value ? 'border-black' : 'border-transparent'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Check className="h-4 w-4 mr-2" />
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Category
        </Button>
      )}
    </div>
  );
}