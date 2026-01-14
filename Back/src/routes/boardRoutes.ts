import { Router } from 'express';
import { getBoards, createBoard, getBoardById, updateBoard, deleteBoard, toggleStar, reorderBoards } from '../controllers/boardController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', getBoards);
router.post('/', createBoard);
router.put('/reorder', reorderBoards);
router.put('/:id', updateBoard);
router.get('/:id', getBoardById);
router.delete('/:id', deleteBoard);
router.patch('/:id/star', toggleStar);

export default router;
