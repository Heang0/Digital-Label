import express from 'express';
import { createVendor, updateVendor, updateProfile } from '../controllers/userController';

const router = express.Router();

// POST /api/users/vendors
router.post('/vendors', createVendor);

// PATCH /api/users/vendors/:id
router.patch('/vendors/:id', updateVendor);

// PATCH /api/users/profile/:id
router.patch('/profile/:id', updateProfile);

export default router;
