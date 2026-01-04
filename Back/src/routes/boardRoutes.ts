import { Router } from 'express';
import * as boardController from '../controllers/boardController';

const router = Router();

router.get('/', boardController.getBoards);
router.post('/', boardController.createBoard);
router.get('/:id', boardController.getBoardById);

export default router;
