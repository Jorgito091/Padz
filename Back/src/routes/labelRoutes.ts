import { Router } from 'express';
import * as labelController from '../controllers/labelController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/board/:boardId', labelController.getBoardLabels);
router.post('/', labelController.createLabel);
router.delete('/:id', labelController.deleteLabel);
router.post('/assign', labelController.addLabelToCard);
router.delete('/unassign/:cardId/:labelId', labelController.removeLabelFromCard);

export default router;
