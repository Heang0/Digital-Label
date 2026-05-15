"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Package, DollarSign, Hash, Edit, Plus, Image, ScanLine } from 'lucide-react';
import { BarcodeScannerModal } from '@/components/ui/BarcodeScannerModal';
import { useNotify } from '@/components/ui/notification';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  productCode?: string;
  category: string;
  basePrice: number;
  cost?: number;
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
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    productCode: '',
    category: 'General',
    basePrice: 0,
    cost: 0,
    imageUrl: '',
    stock: 0,
    minStock: 10,
  });
  const [loading, setLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        sku: product.sku,
        productCode: product.productCode || '',
        category: product.category,
        basePrice: product.basePrice,
        cost: product.cost || 0,
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
        cost: 0,
        imageUrl: '',
        stock: 0,
        minStock: 10,
      });
    }
  }, [product, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.basePrice <= 0) {
      notify.warning(t('missing_fields') || 'Missing fields', t('missing_fields') || 'Please fill in all required fields.');
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
                  {product ? t('edit_product_title') : t('new_product_title')}
                </h2>
                <p className="text-[10px] font-bold text-[#637381] uppercase tracking-widest mt-0.5">{t('master_inventory')}</p>
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
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('product_name')} <span className="text-rose-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('product_name_placeholder')}
                required
                disabled={loading}
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
              />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('sku_auto')}
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
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('product_code')}
              </label>
              <div className="relative group">
                <Input
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                  placeholder={t('product_code_placeholder')}
                  disabled={loading}
                  className="h-11 pl-4 pr-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#5750F1] transition-colors"
                  title={t('scan_barcode')}
                >
                  <ScanLine className="h-4 w-4" />
                </button>
              </div>
            </div>

            <BarcodeScannerModal 
              isOpen={isScannerOpen}
              onClose={() => setIsScannerOpen(false)}
              onScan={(code) => setFormData({ ...formData, productCode: code })}
            />

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('category')} <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white"
                required
                disabled={loading}
              >
                <option value="">{t('select_category_placeholder')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('base_price_label')} <span className="text-rose-500">*</span>
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

            {/* Cost Price */}
            <div className="space-y-2">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('purchase_cost')}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost === 0 ? '' : formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-[#5750F1] transition-all"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('branch_stock')}
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
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('min_threshold')}
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

            {/* Image Upload Area */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('product_image')} <span className="text-slate-400 font-normal">{t('stored_imagekit')}</span>
              </label>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Preview Box */}
                <div className="h-32 w-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 overflow-hidden flex items-center justify-center shrink-0 group relative">
                   {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Product" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button 
                             type="button"
                             onClick={() => setFormData({ ...formData, imageUrl: '' })}
                             className="p-2 bg-rose-500 rounded-full text-white shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform"
                           >
                              <X className="h-4 w-4" />
                           </button>
                        </div>
                      </>
                   ) : (
                      <div className="flex flex-col items-center gap-2">
                         <Image className="h-8 w-8 text-slate-300" />
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('no_image')}</span>
                      </div>
                   )}
                </div>

                {/* Upload Control */}
                <div className="flex-1 flex flex-col justify-center gap-3">
                   <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          setLoading(true);
                          try {
                            const body = new FormData();
                            body.append('image', file);
                            
                            const res = await fetch('http://localhost:5000/api/upload/product', {
                              method: 'POST',
                              body
                            });
                            
                            if (!res.ok) throw new Error('Upload failed');
                            const data = await res.json();
                            setFormData({ ...formData, imageUrl: data.url });
                            notify.success('Image Uploaded', 'Stored securely in ImageKit.');
                          } catch (err) {
                            notify.error('Upload Error', 'Could not save image to cloud.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="w-full h-11 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#5750F1] hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all gap-2">
                         <Plus className="h-4 w-4" />
                         {t('select_real_image')}
                      </Button>
                   </div>
                   
                   <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                         <Hash className="h-3.5 w-3.5" />
                      </div>
                      <Input 
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="pl-9 h-9 text-[10px] rounded-lg bg-slate-50/50 border-slate-100 dark:border-slate-800"
                        placeholder={t('or_paste_url')}
                      />
                   </div>
                   <p className="text-[9px] font-medium text-[#637381] leading-relaxed">
                      {t('image_hint')} <br/>
                      {t('image_hint2').replace('ImageKit.io', '')} <span className="text-blue-500 font-bold">ImageKit.io</span> {t('image_hint2').split('ImageKit.io')[1]}
                   </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-black text-[#111928] dark:text-white uppercase tracking-[0.15em]">
                {t('product_desc_label')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 h-24 text-sm outline-none focus:ring-2 focus:ring-[#5750F1]/20 transition-all text-[#111928] dark:text-white"
                placeholder={t('product_desc_placeholder')}
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
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {product ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('update_product')}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('create_product')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
