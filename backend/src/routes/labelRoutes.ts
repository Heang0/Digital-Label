import { Router } from 'express';
import { getLabels, createLabel } from '../controllers/labelController';

const router = Router();

router.get('/', getLabels);
router.post('/', createLabel);

export default router;
