'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserStore } from '@/lib/user-store';
import { motion, AnimatePresence } from 'framer-motion';

export const ProfileUpload = () => {
  const { user, setUser } = useUserStore();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob as Blob);
          }, 'image/webp', 0.8); // Optimization: WebP format + 80% quality
        };
      };
    });
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      
      // Optimization: Compress before upload
      const compressedBlob = await compressImage(file);
      
      const formData = new FormData();
      formData.append('image', compressedBlob, 'profile.webp');

      // Upload to our backend
      const response = await fetch('http://localhost:5000/api/upload/profile', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      const photoURL = data.url;

      // Update Firestore
      await updateDoc(doc(db, 'users', user.id), {
        photoURL: photoURL
      });

      // Update local store
      setUser({ ...user, photoURL });
      
      setPreview(null);
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-2 bg-transparent sm:p-0">
      <div className="relative">
        <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-[#24303F] shadow-xl transition-colors">
          {preview || user?.photoURL ? (
            <img 
              src={preview || user?.photoURL} 
              alt="Profile" 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-300 dark:text-slate-600">
              <Camera className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
          )}
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-1 right-1 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-[#5750F1] text-white flex items-center justify-center shadow-lg border-4 border-white dark:border-[#24303F] hover:bg-[#4a42e0] transition-all active:scale-90"
        >
          <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        
        <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-[#10B981] border-2 border-white dark:border-[#24303F] shadow-sm" />
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileSelect}
        />
      </div>

      <div className="text-center px-2">
        <h3 className="font-bold text-[#111928] dark:text-white text-base sm:text-lg">Profile Picture</h3>
        <p className="text-[11px] sm:text-xs text-[#637381] dark:text-slate-400 mt-1">PNG, JPG or WebP. Max 5MB.</p>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col sm:flex-row gap-3 w-full"
          >
            <Button 
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 bg-[#5750F1] hover:bg-[#4a42e0] h-12 rounded-2xl shadow-md text-white font-bold"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
            <Button 
              variant="outline"
              onClick={() => setPreview(null)}
              disabled={uploading}
              className="h-12 rounded-2xl border-[#E2E8F0] dark:border-slate-800 text-[#637381] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4 sm:mr-0" />
              <span className="sm:hidden ml-2">Cancel</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
