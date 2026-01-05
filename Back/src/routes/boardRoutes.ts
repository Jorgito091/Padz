import { Router } from 'express';
import { getBoards, createBoard, getBoardById } from '../controllers/boardController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getBoards);
router.post('/', createBoard);
router.get('/:id', getBoardById);

export default router;
