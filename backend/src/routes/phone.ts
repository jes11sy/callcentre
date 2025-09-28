import { Router } from 'express';
import {
  getAllPhones,
  getPhoneById,
  createPhone,
  updatePhone,
  deletePhone,
  getPhoneStats,
} from '../controllers/phoneController';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// All phone routes require admin privileges
router.use(requireAdmin);

// GET /api/phones - Get all phone numbers
router.get('/', getAllPhones);

// GET /api/phones/:id - Get phone number by ID
router.get('/:id', getPhoneById);

// POST /api/phones - Create new phone number
router.post('/', createPhone);

// PUT /api/phones/:id - Update phone number
router.put('/:id', updatePhone);

// DELETE /api/phones/:id - Delete phone number
router.delete('/:id', deletePhone);

// GET /api/phones/:id/stats - Get phone statistics
router.get('/:id/stats', getPhoneStats);

export default router;
