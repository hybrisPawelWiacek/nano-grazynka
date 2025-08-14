import { PrismaClient } from '@prisma/client';

export class DatabaseClient {
  private static instance: PrismaClient;

  private constructor() {}

  static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      try {
        const dbUrl = process.env.DATABASE_URL || 'file:./data/nano-grazynka.db';
        console.log('Initializing PrismaClient with URL:', dbUrl);
        
        DatabaseClient.instance = new PrismaClient({
          log: process.env.NODE_ENV === 'development' 
            ? ['query', 'info', 'warn', 'error'] 
            : ['error'],
          datasources: {
            db: {
              url: dbUrl
            }
          }
        });
        
        // Configure SQLite for better WAL handling
        DatabaseClient.instance.$queryRawUnsafe('PRAGMA journal_mode = WAL;')
          .then((result) => console.log('SQLite WAL mode enabled:', result))
          .catch((error) => console.warn('Failed to set WAL mode:', error));
        
        // Ensure proper synchronization
        DatabaseClient.instance.$queryRawUnsafe('PRAGMA synchronous = NORMAL;')
          .then((result) => console.log('SQLite synchronous mode set:', result))
          .catch((error) => console.warn('Failed to set synchronous mode:', error));
        
        console.log('PrismaClient initialized successfully');
      } catch (error) {
        console.error('Failed to initialize PrismaClient:', error);
        throw error;
      }
    }
    return DatabaseClient.instance;
  }
}