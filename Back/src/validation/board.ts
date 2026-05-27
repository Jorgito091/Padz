import { z } from 'zod';

export const createBoardSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    bgImage: z.string().url().optional(),
    bgColor: z.string().optional(),
    description: z.string().optional()
  })
});

export const updateBoardSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: z.string().min(1).optional(),
    bgImage: z.string().url().optional(),
    bgColor: z.string().optional(),
    description: z.string().optional()
  })
});

export const idParamSchema = z.object({ params: z.object({ id: z.string().uuid() }) });

export const reorderBoardsSchema = z.object({
  body: z.object({
    boardIds: z.array(z.object({ id: z.string().uuid(), order: z.number().int() }))
  })
});
