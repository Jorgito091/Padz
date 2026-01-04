import { Router } from 'express';
import * as listController from '../controllers/listController';

const router = Router();

router.get('/', listController.getLists);
router.post('/', listController.createList);
router.put('/:id', listController.updateList);
router.delete('/:id', listController.deleteList);

export default router;
