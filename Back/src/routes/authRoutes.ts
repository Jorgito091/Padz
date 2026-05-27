import { Router } from 'express';
import { register, login, updateProfile } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { registerSchema, loginSchema, updateProfileSchema } from '../validation/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;
