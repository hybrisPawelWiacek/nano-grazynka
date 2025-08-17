#!/usr/bin/env node

const { PrismaClient } = require('../../backend/node_modules/@prisma/client');
const path = require('path');

// Point to the backend's database
const databaseUrl = `file:${path.join(__dirname, '../../backend/prisma/data/nano-grazynka.db')}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

async function main() {
  try {
    // Get all anonymous sessions
    const sessions = await prisma.anonymousSession.findMany({
      orderBy: { lastUsedAt: 'desc' },
      take: 10
    });

    console.log('\n=== Anonymous Sessions ===');
    if (sessions.length === 0) {
      console.log('No anonymous sessions found');
    } else {
      sessions.forEach(session => {
        console.log(`\nSession ID: ${session.sessionId}`);
        console.log(`  Usage Count: ${session.usageCount}/5`);
        console.log(`  Created: ${session.createdAt}`);
        console.log(`  Last Used: ${session.lastUsedAt}`);
        
        // Check associated voice notes
        prisma.voiceNote.count({
          where: { sessionId: session.sessionId }
        }).then(count => {
          console.log(`  Voice Notes: ${count}`);
        });
      });
    }

    // If --reset flag is provided, reset all counts
    if (process.argv.includes('--reset')) {
      console.log('\n=== Resetting All Anonymous Session Counts ===');
      const result = await prisma.anonymousSession.updateMany({
        data: { usageCount: 0 }
      });
      console.log(`Reset ${result.count} session(s)`);
    }

    // If --reset-session flag is provided with a session ID
    const resetIndex = process.argv.indexOf('--reset-session');
    if (resetIndex !== -1 && process.argv[resetIndex + 1]) {
      const sessionId = process.argv[resetIndex + 1];
      console.log(`\n=== Resetting Session ${sessionId} ===`);
      const result = await prisma.anonymousSession.update({
        where: { sessionId },
        data: { usageCount: 0 }
      });
      console.log(`Reset session ${result.sessionId} to count: ${result.usageCount}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();