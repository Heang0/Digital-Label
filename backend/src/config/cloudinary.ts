import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (!cloud_name || !api_key || !api_secret) {
  console.error('❌ Cloudinary Error: Missing configuration in .env file!');
} else {
  console.log('✅ Cloudinary configured for:', cloud_name);
}

cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'digital-label/profiles',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      format: 'auto', // Optimization: Automatically choose best format (WebP/AVIF)
      quality: 'auto', // Optimization: Automatically choose best quality/compression
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' } // Optimization: Center on face and resize
      ],
    };
  },
});

export { cloudinary, storage };
