import prisma from './src/prisma';

async function test() {
    try {
        const board = await prisma.board.findFirst({
            include: {
                lists: {
                    include: {
                        cards: {
                            include: {
                                labels: {
                                    include: {
                                        label: true
                                    }
                                }
                            }
                        }
                    }
                },
                labels: true,
                members: true
            }
        });
        console.log('Query success:', JSON.stringify(board, null, 2));
    } catch (error) {
        console.error('Query error:', error);
    } finally {
        process.exit();
    }
}

test();
