// Script to test database sessionId storage
// Run inside Docker container

const testScript = `
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:/app/prisma/data/nano-grazynka.db'
      }
    }
  });

  const voiceNotes = await prisma.voiceNote.findMany({
    select: {
      id: true,
      sessionId: true,
      userId: true,
      title: true,
      status: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  console.log('Recent voice notes:');
  voiceNotes.forEach(vn => {
    console.log(JSON.stringify({
      id: vn.id,
      sessionId: vn.sessionId || 'NULL',
      userId: vn.userId || 'NULL',
      title: vn.title,
      status: vn.status
    }, null, 2));
  });

  await prisma.$disconnect();
}

test().catch(console.error);
`;

console.log(testScript);