import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// All routes in this file require admin role
router.use(requireAdmin);

// Admin-only routes will be added here
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard data',
    data: {
      // Dashboard stats will be implemented later
      message: 'Admin dashboard - coming soon'
    }
  });
});

export default router;
