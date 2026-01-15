"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Package, DollarSign, Hash, Edit, Plus, Image } from 'lucide-react';

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
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {product ? 'Edit Product' : 'New Product'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            {product ? 'Update product details' : 'Add a new product to your catalog'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Organic Milk 1L"
                required
                disabled={loading}
              />
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                SKU (auto if empty)
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="pl-10"
                placeholder="PR-00001"
                disabled={loading}
              />
            </div>
          </div>

            {/* Product Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Product Code (auto if empty)
              </label>
              <Input
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                placeholder="PR-VE001-00001"
                disabled={loading}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
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
              <label className="text-sm font-medium text-gray-700">
                Base Price ($) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                  className="pl-10"
                  placeholder="0.00"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Stock (selected branch)
              </label>
              <Input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                disabled={loading}
              />
            </div>

            {/* Min Stock */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Min Stock
              </label>
              <Input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
                disabled={loading}
              />
            </div>

            {/* Image URL */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Product Image URL
              </label>
              <div className="relative">
                <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="pl-10"
                  placeholder="https://example.com/image.jpg"
                  disabled={loading}
                />
              </div>
              {formData.imageUrl && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Preview:</div>
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="h-20 w-20 rounded-lg object-cover border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 h-32"
                placeholder="Product description..."
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
