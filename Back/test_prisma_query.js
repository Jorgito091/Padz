const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = '49b79383-8340-46f3-97de-9f634310d613'; // jorigtoturco@gmail.com
    console.log(`Checking boards for userId: ${userId}`);

    const boards = await prisma.board.findMany({
        where: {
            OR: [
                { ownerId: userId },
                { members: { some: { userId: userId } } }
            ]
        },
        include: {
            lists: { include: { cards: true } },
            owner: { select: { name: true, avatar: true } },
            members: { include: { user: { select: { id: true, name: true, avatar: true } } } }
        },
        orderBy: [
            { isStarred: 'desc' },
            { order: 'asc' },
            { createdAt: 'desc' }
        ]
    });

    console.log('Boards found:', JSON.stringify(boards, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
