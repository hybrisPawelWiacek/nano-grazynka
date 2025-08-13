#!/usr/bin/env node

const { execSync } = require('child_process');

// Create a test script inside the container
const testScript = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    // Get the latest voice note
    const notes = await prisma.voiceNote.findMany({
      take: 1,
      orderBy: { createdAt: 'desc' }
    });
    
    if (notes.length > 0) {
      const note = notes[0];
      console.log('\\n=== RAW DATA FROM PRISMA ===');
      console.log('ID:', note.id);
      console.log('\\n--- Multi-model fields ---');
      console.log('transcriptionModel:', note.transcriptionModel);
      console.log('geminiSystemPrompt:', note.geminiSystemPrompt);
      console.log('geminiUserPrompt:', note.geminiUserPrompt);
      console.log('whisperPrompt:', note.whisperPrompt);
      console.log('\\n--- Timestamps ---');
      console.log('createdAt:', note.createdAt);
      console.log('updatedAt:', note.updatedAt);
      console.log('version:', note.version);
      
      console.log('\\n=== FIELD TYPES ===');
      console.log('typeof transcriptionModel:', typeof note.transcriptionModel);
      console.log('typeof geminiSystemPrompt:', typeof note.geminiSystemPrompt);
      console.log('typeof geminiUserPrompt:', typeof note.geminiUserPrompt);
      
      console.log('\\n=== ALL FIELDS ===');
      Object.keys(note).forEach(key => {
        const value = note[key];
        const type = typeof value;
        const preview = type === 'string' ? value.substring(0, 50) : value;
        console.log(\`\${key}: [\${type}] \${preview}\`);
      });
    } else {
      console.log('No voice notes found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
`;

// Write the script to a temp file and execute it in the container
require('fs').writeFileSync('/tmp/test-prisma.js', testScript);

console.log('Testing direct Prisma access...\n');

try {
  // Copy the script to the container and run it
  execSync('docker cp /tmp/test-prisma.js nano-grazynka_cc-backend-1:/tmp/test-prisma.js');
  const output = execSync('docker exec nano-grazynka_cc-backend-1 node /tmp/test-prisma.js');
  console.log(output.toString());
} catch (error) {
  console.error('Error running test:', error.message);
  if (error.stdout) console.log('Output:', error.stdout.toString());
  if (error.stderr) console.error('Error output:', error.stderr.toString());
}