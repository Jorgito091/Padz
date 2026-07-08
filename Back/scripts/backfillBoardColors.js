const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const palette = [
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#0ea5e9',
  '#6366f1',
  '#d946ef',
];

const classToHex = {
  'bg-rose-500': '#f43f5e',
  'bg-red-500': '#ef4444',
  'bg-orange-500': '#f97316',
  'bg-amber-400': '#f59e0b',
  'bg-lime-500': '#84cc16',
  'bg-emerald-500': '#10b981',
  'bg-cyan-500': '#06b6d4',
  'bg-sky-500': '#0ea5e9',
  'bg-indigo-500': '#6366f1',
  'bg-fuchsia-500': '#d946ef',
  'bg-white': '#f43f5e',
};

async function main() {
  const boards = await prisma.board.findMany({
    where: {
      OR: [
        { bgColor: null },
        { bgColor: { startsWith: 'bg-' } },
      ],
    },
    orderBy: [
      { createdAt: 'asc' },
      { id: 'asc' },
    ],
    select: { id: true, title: true },
  });

  if (boards.length === 0) {
    console.log('No legacy boards found.');
    return;
  }

  for (let index = 0; index < boards.length; index += 1) {
    const board = boards[index];
    const currentColor = board.bgColor;
    const bgColor = currentColor && classToHex[currentColor]
      ? classToHex[currentColor]
      : palette[index % palette.length];

    await prisma.board.update({
      where: { id: board.id },
      data: { bgColor },
    });

    console.log(`Updated ${board.title} -> ${bgColor}`);
  }

  console.log(`Backfilled ${boards.length} boards.`);
}

main()
  .catch((error) => {
    console.error('Failed to backfill board colors:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });