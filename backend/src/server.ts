import { app } from './app';
import { env } from './config/env';
import { checkDatabaseConnection, prisma } from './config/db';
import { logger } from './utils/logger';

async function bootstrap() {
  const port = parseInt(env.PORT, 10) || 8085;

  // Verify database connectivity
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    logger.warn('⚠️ Database connection check failed on startup. Will retry on request.');
  } else {
    logger.info('✅ PostgreSQL / Supabase database connected successfully.');
  }

  const server = app.listen(port, () => {
    logger.info(`🚀 WayRivo AI 2.0 Backend listening on port ${port}`);
    logger.info(`🌐 Health check: http://localhost:${port}/api/v1/health`);
    logger.info(`✨ Environment: ${env.NODE_ENV}`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      logger.info('Database connections closed.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forcefully terminating process after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error:', err);
  process.exit(1);
});
