import { Router } from 'express';
import { createComment, getComments, deleteComment } from '../controllers/commentController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', createComment);
router.get('/:cardId', getComments);
router.delete('/:id', deleteComment);

export default router;
