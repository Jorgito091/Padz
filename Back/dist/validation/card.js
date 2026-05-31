"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCardsSchema = exports.unassignUserParamsSchema = exports.assignUserSchema = exports.deleteCardSchema = exports.updateCardSchema = exports.createCardSchema = void 0;
const zod_1 = require("zod");
exports.createCardSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        description: zod_1.z.string().optional(),
        order: zod_1.z.number().int().optional(),
        listId: zod_1.z.string().uuid(),
        dueDate: zod_1.z.string().datetime().optional(),
        isDone: zod_1.z.boolean().optional()
    })
});
exports.updateCardSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        description: zod_1.z.string().optional(),
        order: zod_1.z.number().int().optional(),
        listId: zod_1.z.string().uuid().optional(),
        dueDate: zod_1.z.string().datetime().optional(),
        isDone: zod_1.z.boolean().optional()
    })
});
exports.deleteCardSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().uuid() })
});
exports.assignUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        cardId: zod_1.z.string().uuid(),
        userId: zod_1.z.string().uuid()
    })
});
exports.unassignUserParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        cardId: zod_1.z.string().uuid(),
        userId: zod_1.z.string().uuid()
    })
});
exports.searchCardsSchema = zod_1.z.object({
    query: zod_1.z.object({
        q: zod_1.z.string().optional(),
        labelIds: zod_1.z.string().optional(), // comma separated label ids
        assignedTo: zod_1.z.string().uuid().optional(),
        boardId: zod_1.z.string().uuid().optional(),
        isDone: zod_1.z.string().optional(), // 'true'|'false'
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional()
    })
});
