import { Router } from 'express';
import * as cardController from '../controllers/cardController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.post('/', cardController.createCard);
router.put('/:id', cardController.updateCard);
router.delete('/:id', cardController.deleteCard);

router.post('/assign', cardController.assignUser);
router.delete('/unassign/:cardId/:userId', cardController.unassignUser);

export default router;
