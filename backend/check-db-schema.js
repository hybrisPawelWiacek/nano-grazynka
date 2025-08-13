const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Use raw query to check actual database schema
    const tableInfo = await prisma.$queryRaw`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='VoiceNote'
    `;
    
    console.log('VoiceNote table schema:');
    console.log(tableInfo);
    
    // Also check column info
    const columns = await prisma.$queryRaw`
      PRAGMA table_info(VoiceNote)
    `;
    
    console.log('\nColumn information:');
    columns.forEach(col => {
      console.log(`${col.cid}: ${col.name} (${col.type})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();