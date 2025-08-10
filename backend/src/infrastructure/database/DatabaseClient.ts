import { PrismaClient } from '@prisma/client';

export class DatabaseClient {
  private static instance: PrismaClient;

  private constructor() {}

  static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error'] 
          : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL || 'file:./data/nano-grazynka.db'
          }
        }
      });
    }
    return DatabaseClient.instance;
  }
}