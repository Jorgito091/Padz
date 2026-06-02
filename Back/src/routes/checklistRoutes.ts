import { Router } from 'express';
import {
    getChecklistsByCard,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
} from '../controllers/checklistController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import {
    cardIdParamSchema,
    createChecklistSchema,
    updateChecklistSchema,
    deleteChecklistSchema,
    createChecklistItemSchema,
    updateChecklistItemSchema,
    deleteChecklistItemSchema,
} from '../validation/checklist';

const router = Router();

router.use(authenticate);

router.get('/card/:cardId', validate(cardIdParamSchema), getChecklistsByCard);
router.post('/', validate(createChecklistSchema), createChecklist);
router.put('/:id', validate(updateChecklistSchema), updateChecklist);
router.delete('/:id', validate(deleteChecklistSchema), deleteChecklist);
router.post('/items', validate(createChecklistItemSchema), createChecklistItem);
router.put('/items/:id', validate(updateChecklistItemSchema), updateChecklistItem);
router.delete('/items/:id', validate(deleteChecklistItemSchema), deleteChecklistItem);

export default router;
