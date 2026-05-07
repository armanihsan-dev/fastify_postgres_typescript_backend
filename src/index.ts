import buildApp from './app';
import { closeDB } from './db/db';

async function start() {
  const fastify = await buildApp();

  try {
    fastify.listen({ port: Number(process.env.port) || 3000, host: '0.0.0.0' });
    fastify.log.info('Server started successfully');

    // Print all registered routes (useful for debugging)
    fastify.log.info(fastify.printRoutes());
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await closeDB();
  process.exit(0);
});

start();
