import { Router } from 'express';
import { getBoards, createBoard, getBoardById, updateBoard } from '../controllers/boardController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getBoards);
router.post('/', createBoard);
router.put('/:id', updateBoard);
router.get('/:id', getBoardById);

export default router;
