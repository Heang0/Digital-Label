'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserStore } from '@/lib/user-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Label {
  id: string;
  labelId?: string;
  labelCode?: string;
  productId?: string | null;
  productName?: string | null;
  productSku?: string | null;
  branchId?: string;
  companyId?: string;
  currentPrice?: number | null;
  basePrice?: number | null;
  discountPercent?: number | null;
  discountPrice?: number | null;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  basePrice?: number;
}

interface BranchProduct {
  id: string;
  productId: string;
  branchId: string;
  companyId?: string;
  currentPrice: number;
}

export default function LabelProductPage() {
  const params = useParams<{ labelId: string }>();
  const router = useRouter();
  const { user: currentUser, hasHydrated } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState<Label | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [branchProduct, setBranchProduct] = useState<BranchProduct | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    basePrice: '',
    branchPrice: '',
    discountPercent: '',
  });

  const canEdit = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'vendor' || currentUser.role === 'admin') return true;
    if (currentUser.role !== 'staff') return false;
    if (currentUser.branchId && label?.branchId && currentUser.branchId !== label.branchId) {
      return false;
    }
    return Boolean(
      currentUser.permissions?.canCreateProducts ||
        currentUser.permissions?.canChangePrices
    );
  }, [currentUser, label?.branchId]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!currentUser) {
      if (!params?.labelId) return;
      if (params.labelId === 'undefined' || params.labelId === 'null') return;
      const next = encodeURIComponent(`/label-product/${params.labelId}`);
      router.push(`/login?next=${next}`);
    }
  }, [currentUser, hasHydrated, params.labelId, router]);

  useEffect(() => {
    if (!params?.labelId) return;
    if (params.labelId === 'undefined' || params.labelId === 'null') {
      setErrorMessage('Invalid label link.');
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        let labelSnap = await getDoc(doc(db, 'labels', params.labelId));
        if (!labelSnap.exists()) {
          const labelIdQuery = query(
            collection(db, 'labels'),
            where('labelId', '==', params.labelId)
          );
          const labelIdSnap = await getDocs(labelIdQuery);
          if (!labelIdSnap.empty) {
            labelSnap = labelIdSnap.docs[0];
          } else {
            const labelCodeQuery = query(
              collection(db, 'labels'),
              where('labelCode', '==', params.labelId)
            );
            const labelCodeSnap = await getDocs(labelCodeQuery);
            if (!labelCodeSnap.empty) {
              labelSnap = labelCodeSnap.docs[0];
            }
          }
        }
        if (!labelSnap.exists()) {
          setErrorMessage('Label not found.');
          setLoading(false);
          return;
        }
        const labelData = { ...(labelSnap.data() as any), id: labelSnap.id } as Label;
        setLabel(labelData);

        if (!labelData.productId) {
          setErrorMessage('No product assigned to this label.');
          setLoading(false);
          return;
        }

        const productSnap = await getDoc(doc(db, 'products', labelData.productId));
        if (!productSnap.exists()) {
          setErrorMessage('Product not found.');
          setLoading(false);
          return;
        }

        const productData = { id: productSnap.id, ...(productSnap.data() as any) } as Product;
        setProduct(productData);

        let branchProductData: BranchProduct | null = null;
        if (labelData.branchId) {
          const bpQuery = query(
            collection(db, 'branch_products'),
            where('productId', '==', labelData.productId),
            where('branchId', '==', labelData.branchId)
          );
          const bpSnap = await getDocs(bpQuery);
          if (!bpSnap.empty) {
            const docSnap = bpSnap.docs[0];
            branchProductData = { id: docSnap.id, ...(docSnap.data() as any) } as BranchProduct;
          }
        }
        setBranchProduct(branchProductData);

        const basePriceValue =
          productData.basePrice ?? labelData.basePrice ?? labelData.currentPrice ?? 0;
        const branchPriceValue =
          branchProductData?.currentPrice ??
          labelData.currentPrice ??
          productData.basePrice ??
          0;
        const discountPercentValue =
          labelData.discountPercent != null ? Number(labelData.discountPercent) : 0;

        setFormState({
          name: productData.name ?? '',
          description: productData.description ?? '',
          basePrice: basePriceValue ? String(basePriceValue) : '',
          branchPrice: branchPriceValue ? String(branchPriceValue) : '',
          discountPercent: discountPercentValue ? String(discountPercentValue) : '',
        });
      } catch (error) {
        console.error('Error loading label product:', error);
        setErrorMessage('Could not load label product.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params?.labelId]);

  const handleSave = async () => {
    if (!label || !product) return;
    if (!canEdit) return;
    const name = formState.name.trim();
    if (!name) {
      setErrorMessage('Product name is required.');
      return;
    }
    const branchPrice = Number(formState.branchPrice);
    if (!Number.isFinite(branchPrice) || branchPrice <= 0) {
      setErrorMessage('Enter a valid branch price.');
      return;
    }
    const discountPercent = Number(formState.discountPercent);
    if (
      formState.discountPercent !== '' &&
      (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100)
    ) {
      setErrorMessage('Enter a discount between 0 and 100.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      await updateDoc(doc(db, 'products', product.id), {
        name,
        description: formState.description.trim(),
        updatedAt: Timestamp.now(),
      });

      if (branchProduct?.id) {
        await updateDoc(doc(db, 'branch_products', branchProduct.id), {
          currentPrice: branchPrice,
          lastUpdated: Timestamp.now(),
        });
      } else if (label.branchId && label.companyId) {
        await addDoc(collection(db, 'branch_products'), {
          productId: product.id,
          branchId: label.branchId,
          companyId: label.companyId,
          currentPrice: branchPrice,
          stock: 0,
          minStock: 0,
          status: 'in-stock',
          lastUpdated: Timestamp.now(),
        });
      }

      const effectiveDiscount =
        formState.discountPercent === '' ? null : Number(discountPercent);
      const finalPrice =
        effectiveDiscount != null
          ? Number((branchPrice * (1 - effectiveDiscount / 100)).toFixed(2))
          : branchPrice;

      await updateDoc(doc(db, 'labels', label.id), {
        productName: name,
        productSku: product.sku ?? null,
        currentPrice: branchPrice,
        basePrice: branchPrice,
        finalPrice,
        discountPercent: effectiveDiscount,
        discountPrice: effectiveDiscount != null ? finalPrice : null,
        lastSync: Timestamp.now(),
        status: 'syncing',
      });

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              name,
              description: formState.description.trim(),
            }
          : prev
      );
      setLabel((prev) =>
        prev
          ? {
              ...prev,
              productName: name,
              currentPrice: branchPrice,
              basePrice: branchPrice,
              discountPercent: effectiveDiscount,
              finalPrice,
            }
          : prev
      );
      setBranchProduct((prev) =>
        prev
          ? {
              ...prev,
              currentPrice: branchPrice,
            }
          : prev
      );
    } catch (error) {
      console.error('Error saving label product:', error);
      setErrorMessage('Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-3xl mx-auto rounded-xl border bg-white p-6 text-sm text-gray-600">
          Loading product...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
        <div className="max-w-3xl mx-auto rounded-xl border bg-white p-6 text-sm text-gray-600">
          {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Product Editor</h1>
          <p className="text-sm text-gray-600">
            Label: {label?.labelId || label?.labelCode || label?.id}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Product Name</label>
              <Input
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">SKU</label>
              <Input value={product?.sku || '--'} disabled />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <Input
                value={formState.description}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, description: e.target.value }))
                }
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Branch Price</label>
              <Input
                type="number"
                step="0.01"
                value={formState.branchPrice}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, branchPrice: e.target.value }))
                }
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Discount (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={formState.discountPercent}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, discountPercent: e.target.value }))
                }
                disabled={!canEdit}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Base Price</label>
              <Input value={formState.basePrice} disabled />
            </div>
          </div>

          {!canEdit && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              You can view this product, but you do not have permission to edit.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={handleSave} disabled={!canEdit || saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
