import { Router } from 'express';
import { register, login, updateProfile } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.put('/profile', authenticate, updateProfile);

export default router;
