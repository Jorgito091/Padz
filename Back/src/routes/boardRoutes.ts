import { Router } from 'express';
import { getBoards, createBoard, getBoardById, updateBoard, deleteBoard, toggleStar, reorderBoards } from '../controllers/boardController';
import { authenticate } from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { createBoardSchema, updateBoardSchema, idParamSchema, reorderBoardsSchema } from '../validation/board';

const router = Router();

router.use(authenticate);

router.get('/', getBoards);
router.post('/', validate(createBoardSchema), createBoard);
router.put('/reorder', validate(reorderBoardsSchema), reorderBoards);
router.put('/:id', validate(updateBoardSchema), updateBoard);
router.get('/:id', validate(idParamSchema), getBoardById);
router.delete('/:id', validate(idParamSchema), deleteBoard);
router.patch('/:id/star', validate(idParamSchema), toggleStar);

export default router;
