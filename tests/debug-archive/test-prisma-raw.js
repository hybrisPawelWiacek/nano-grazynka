const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrismaRaw() {
  try {
    // Get the latest voice note
    const latest = await prisma.voiceNote.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (latest) {
      console.log('Latest VoiceNote from Prisma:');
      console.log('ID:', latest.id);
      console.log('Title:', latest.title);
      console.log('transcriptionModel:', latest.transcriptionModel);
      console.log('whisperPrompt:', latest.whisperPrompt);
      console.log('geminiSystemPrompt:', latest.geminiSystemPrompt);
      console.log('geminiUserPrompt:', latest.geminiUserPrompt);
      console.log('createdAt:', latest.createdAt);
      console.log('updatedAt:', latest.updatedAt);
      console.log('version:', latest.version);
      
      console.log('\nAll fields:');
      console.log(JSON.stringify(latest, null, 2));
    } else {
      console.log('No voice notes found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaRaw();