import { z } from 'zod';

export const createCardSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    order: z.number().int().optional(),
    listId: z.string().uuid(),
    dueDate: z.string().datetime().optional(),
    isDone: z.boolean().optional()
  })
});

export const updateCardSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    order: z.number().int().optional(),
    listId: z.string().uuid().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    isDone: z.boolean().optional()
  })
});

export const deleteCardSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});

export const assignUserSchema = z.object({
  body: z.object({
    cardId: z.string().uuid(),
    userId: z.string().uuid()
  })
});

export const unassignUserParamsSchema = z.object({
  params: z.object({
    cardId: z.string().uuid(),
    userId: z.string().uuid()
  })
});

export const searchCardsSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    labelIds: z.string().optional(), // comma separated label ids
    assignedTo: z.string().uuid().optional(),
    boardId: z.string().uuid().optional(),
    isDone: z.string().optional(), // 'true'|'false'
    page: z.string().optional(),
    limit: z.string().optional()
  })
});
