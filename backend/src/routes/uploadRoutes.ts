import { Router } from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary';
import { uploadProfileImage } from '../controllers/uploadController';

const router = Router();
const upload = multer({ storage });

// POST /api/upload/profile
router.post('/profile', upload.single('image'), uploadProfileImage);

export default router;
