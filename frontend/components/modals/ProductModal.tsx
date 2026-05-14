"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Package, DollarSign, Hash, Edit, Plus, Image } from 'lucide-react';
import { useNotify } from '@/components/ui/notification';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  productCode?: string;
  category: string;
  basePrice: number;
  imageUrl?: string;
  stock?: number;
  minStock?: number;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  categories: Array<{ id: string; name: string }>;
  onSubmit: (productData: Omit<Product, 'id'>) => Promise<void>;
}

export default function ProductModal({ 
  isOpen, 
  onClose, 
  product,
  categories,
  onSubmit 
}: ProductModalProps) {
  const notify = useNotify();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    productCode: '',
    category: 'General',
    basePrice: 0,
    imageUrl: '',
    stock: 0,
    minStock: 10,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        sku: product.sku,
        productCode: product.productCode || '',
        category: product.category,
        basePrice: product.basePrice,
        imageUrl: product.imageUrl || '',
        stock: product.stock ?? 0,
        minStock: product.minStock ?? 10,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        sku: '',
        productCode: '',
        category: categories.length > 0 ? categories[0].name : 'General',
        basePrice: 0,
        imageUrl: '',
        stock: 0,
        minStock: 10,
      });
    }
  }, [product, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.basePrice <= 0) {
      notify.warning('Missing fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      notify.error('Save failed', 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1C2434] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#111928] dark:text-white">
                  {product ? 'Edit Product' : 'New Product'}
                </h2>
                <p className="text-[10px] font-bold text-[#637381] uppercase tracking-widest mt-0.5">Master Inventory Repository</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Organic Milk 1L"
                required
                disabled={loading}
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
              />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">
                SKU (auto if empty)
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
                placeholder="PR-00001"
                disabled={loading}
              />
            </div>
          </div>

            {/* Product Code */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">
                Product Code
              </label>
              <Input
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                placeholder="PR-VE001-00001"
                disabled={loading}
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white"
                required
                disabled={loading}
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">
                Base Price ($) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.basePrice === 0 ? '' : formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all font-bold"
                  placeholder="0.00"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">
                Branch Stock
              </label>
              <Input
                type="number"
                min="0"
                value={formData.stock === 0 ? '' : formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                disabled={loading}
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
                placeholder="0"
              />
            </div>

            {/* Min Stock */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">
                Minimum Threshold
              </label>
              <Input
                type="number"
                min="0"
                value={formData.minStock === 0 ? '' : formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
                disabled={loading}
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
                placeholder="0"
              />
            </div>

            {/* Image URL */}
            <div className="md:col-span-1 space-y-2">
              <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">
                Media URL
              </label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
                  placeholder="https://images.unsplash.com/..."
                  disabled={loading}
                />
              </div>
            </div>

            {/* Preview Image Slot */}
            <div className="md:col-span-1 flex items-end">
               {formData.imageUrl ? (
                  <div className="h-11 w-full rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 overflow-hidden flex items-center px-4 gap-3">
                     <img src={formData.imageUrl} alt="Preview" className="h-7 w-7 rounded object-cover" />
                     <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Valid Image Preview</span>
                  </div>
               ) : (
                  <div className="h-11 w-full rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex items-center px-4 gap-3">
                     <Image className="h-4 w-4 text-slate-300" />
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Image Attached</span>
                  </div>
               )}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-[#637381] uppercase tracking-[0.15em]">
                Product Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 h-24 text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white"
                placeholder="Enter detailed product specifications..."
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {product ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Update Product
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Product
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
