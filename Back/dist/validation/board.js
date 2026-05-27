"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderBoardsSchema = exports.idParamSchema = exports.updateBoardSchema = exports.createBoardSchema = void 0;
const zod_1 = require("zod");
exports.createBoardSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1),
        bgImage: zod_1.z.string().url().optional(),
        bgColor: zod_1.z.string().optional(),
        description: zod_1.z.string().optional()
    })
});
exports.updateBoardSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).optional(),
        bgImage: zod_1.z.string().url().optional(),
        bgColor: zod_1.z.string().optional(),
        description: zod_1.z.string().optional()
    })
});
exports.idParamSchema = zod_1.z.object({ params: zod_1.z.object({ id: zod_1.z.string().uuid() }) });
exports.reorderBoardsSchema = zod_1.z.object({
    body: zod_1.z.object({
        boardIds: zod_1.z.array(zod_1.z.object({ id: zod_1.z.string().uuid(), order: zod_1.z.number().int() }))
    })
});
