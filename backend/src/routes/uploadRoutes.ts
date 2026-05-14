import { Router } from 'express';
import multer from 'multer';
import { uploadProfileImage } from '../controllers/uploadController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload/profile
router.post('/profile', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer/Cloudinary Error:', JSON.stringify(err, null, 2));
      return res.status(500).json({ 
        message: 'Cloudinary upload failed', 
        error: err.message || err,
        details: err
      });
    }
    next();
  });
}, uploadProfileImage);

export default router;
