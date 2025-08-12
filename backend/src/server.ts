import { createApp } from './presentation/api/app';
import { Container } from './presentation/api/container';
import { DatabaseClient } from './infrastructure/database/DatabaseClient';

async function start() {
  try {
    const container = Container.getInstance();
    const config = container.getConfig();
    const prisma = DatabaseClient.getInstance();
    
    await prisma.$connect();
    console.log('✅ Database connected');
    
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL');
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL');
    
    const app = await createApp();
    
    const port = config.server.port;
    const host = config.server.host;
    
    await app.listen({ port, host });
    
    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log('📝 Configuration loaded successfully');
    
    const observability = container.getObservability();
    const providers = observability.getProviders();
    if (providers.some(p => p.constructor.name === 'LangSmithObservabilityProvider')) {
      console.log('🔍 LangSmith observability enabled');
    }
    if (providers.some(p => p.constructor.name === 'OpenLLMetryObservabilityProvider')) {
      console.log('📊 OpenLLMetry observability enabled');
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const container = Container.getInstance();
  await container.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const container = Container.getInstance();
  await container.shutdown();
  process.exit(0);
});

start();