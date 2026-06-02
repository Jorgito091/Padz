import prisma from '../prisma';
import { AppError } from './AppError';

export async function getCardWithBoardAccess(cardId: string, userId: string) {
    const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: {
            list: {
                include: {
                    board: { include: { members: true } },
                },
            },
        },
    });

    if (!card) throw new AppError('Card not found', 404);

    const board = card.list.board;
    const isOwner = board.ownerId === userId;
    const member = board.members.find((m) => m.userId === userId);

    if (!isOwner && !member) {
        throw new AppError('Access denied', 403);
    }

    const canEdit = isOwner || member?.role === 'MEMBER';

    return { card, board, canEdit };
}

export async function assertCanEditCard(cardId: string, userId: string) {
    const { card, board, canEdit } = await getCardWithBoardAccess(cardId, userId);
    if (!canEdit) throw new AppError('Access denied. Insufficient permissions.', 403);
    return { card, board };
}
