const { PrismaClient } = require('@prisma/client');

async function testDatabaseSession() {
  // Connect to the database inside Docker
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:/Users/pawelwiacek/Library/CloudStorage/GoogleDrive-pawel.wiacek84@gmail.com/My Drive/work_home/ai_agents_dev/nano-grazynka_CC/backend/prisma/data/nano-grazynka.db'
      }
    }
  });

  try {
    // Find all voice notes and show their sessionId
    const voiceNotes = await prisma.voiceNote.findMany({
      select: {
        id: true,
        sessionId: true,
        userId: true,
        title: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('Recent voice notes:');
    voiceNotes.forEach(vn => {
      console.log({
        id: vn.id,
        sessionId: vn.sessionId || 'NULL',
        userId: vn.userId || 'NULL',
        title: vn.title,
        status: vn.status
      });
    });

    // Check specific voice note
    const specificId = '77606ae0-54e3-4d3f-8ece-3651e752cb38';
    const specific = await prisma.voiceNote.findUnique({
      where: { id: specificId }
    });

    if (specific) {
      console.log('\nSpecific voice note:');
      console.log({
        id: specific.id,
        sessionId: specific.sessionId || 'NULL',
        userId: specific.userId || 'NULL',
        title: specific.title
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseSession();