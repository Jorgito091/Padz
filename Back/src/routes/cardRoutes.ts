import { Router } from 'express';

import * as cardController from '../controllers/cardController';
import { authenticate } from '../middleware/authMiddleware';
import validate from '../middleware/validate';
import { createCardSchema, updateCardSchema, assignUserSchema, unassignUserParamsSchema, deleteCardSchema } from '../validation/card';

const router = Router();

router.use(authenticate);

router.post('/', validate(createCardSchema), cardController.createCard);
router.put('/:id', validate(updateCardSchema), cardController.updateCard);
router.delete('/:id', validate(deleteCardSchema), cardController.deleteCard);

router.post('/assign', validate(assignUserSchema), cardController.assignUser);
router.delete('/unassign/:cardId/:userId', validate(unassignUserParamsSchema), cardController.unassignUser);

export default router;
