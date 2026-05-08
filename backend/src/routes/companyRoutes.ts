import { Router } from 'express';
import { createCompany, updateCompany } from '../controllers/companyController';

const router = Router();

// POST /api/companies
router.post('/', createCompany);

// PATCH /api/companies/:id
router.patch('/:id', updateCompany);

export default router;
