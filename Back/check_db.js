const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const boards = await prisma.board.findMany();
    console.log('Boards in DB:', JSON.stringify(boards, null, 2));
    const users = await prisma.user.findMany();
    console.log('Users in DB:', JSON.stringify(users.map(u => ({ id: u.id, email: u.email })), null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
