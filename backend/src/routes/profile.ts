import { Router } from 'express';
import { profileController } from '../controllers/profileController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Получить профиль текущего пользователя
router.get('/', authenticate, profileController.getProfile);

// Обновить профиль текущего пользователя
router.put('/', authenticate, profileController.updateProfile);

// Получить статистику профиля (для операторов)
router.get('/stats', authenticate, profileController.getProfileStats);

export default router;
