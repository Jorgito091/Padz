import { z } from 'zod';

export const cardIdParamSchema = z.object({
    params: z.object({ cardId: z.string().uuid() }),
});

export const createChecklistSchema = z.object({
    body: z.object({
        cardId: z.string().uuid(),
        title: z.string().min(1).max(100).optional(),
    }),
});

export const updateChecklistSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        title: z.string().min(1).max(100).optional(),
        order: z.number().int().optional(),
    }),
});

export const deleteChecklistSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
});

export const createChecklistItemSchema = z.object({
    body: z.object({
        checklistId: z.string().uuid(),
        title: z.string().min(1).max(500),
    }),
});

export const updateChecklistItemSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
        title: z.string().min(1).max(500).optional(),
        isDone: z.boolean().optional(),
        order: z.number().int().optional(),
    }),
});

export const deleteChecklistItemSchema = z.object({
    params: z.object({ id: z.string().uuid() }),
});
