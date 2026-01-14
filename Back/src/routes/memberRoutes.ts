import { Router } from 'express';
import { addMember, getBoardMembers, removeMember } from '../controllers/memberController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', addMember);
router.get('/:boardId', getBoardMembers);
router.delete('/:boardId/:userId', removeMember);

export default router;
