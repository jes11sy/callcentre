import { Router } from 'express';
import { requireOperator } from '../middleware/auth';

const router = Router();

// All routes in this file require operator or admin role
router.use(requireOperator);

// Operator routes will be added here
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Operator dashboard data',
    data: {
      // Dashboard stats will be implemented later
      message: 'Operator dashboard - coming soon',
      user: req.user
    }
  });
});

export default router;
