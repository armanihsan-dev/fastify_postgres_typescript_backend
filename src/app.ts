import Fastify, {
  FastifyInstance,
} from 'fastify';
import { userRoutes } from './routes/UserRoutes';
import { AuthRoutes } from './routes/AuthRoutes';
import { PostsRoutes } from './routes/PostRoutes';
import fastifyJwt from '@fastify/jwt';
import { setupAuthHook } from './hooks/auth';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

export default async function buildApp(): Promise<FastifyInstance> {

  //logger
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty', // Pretty console logs
        options: { translateTime: 'HH:MM:ss Z' },
      },
    },
  });

  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      },
    },
  })

  await fastify.register(fastifyCors, {
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  });


  // jwt registry  
  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'MYSerret',
    sign: {
      expiresIn: '7d', // Token expires in 7 days
    },
  });

  //swegger(API documentation)
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Blog API',
        description: 'API documentation for blog application',
        version: '1.0.0'
      },
      servers: [{ url: 'http://localhost:3100', description: 'Development server' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      security: [{ bearerAuth: [] }]
    },
    transform: ({ schema, url }) => {
      return { schema, url };
    }
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true
    }
  });

  //authentication hook
  await setupAuthHook(fastify)

  //protected routes
  await fastify.register(AuthRoutes, { prefix: '/api/v1' });
  await fastify.register(userRoutes, { prefix: '/api/v1' });
  await fastify.register(PostsRoutes, { prefix: '/api/v1' });


  // custom api testing 
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });


  // global error handler
  fastify.setErrorHandler((error, request, reply) => {
    // Use the error's statusCode if it exists, otherwise default to 500
    const statusCode = error.statusCode || 500;

    fastify.log.error(error);

    reply.status(statusCode).send({
      success: false,
      error: error.message || 'Internal server error',
      // Optional: Add stack trace only in development
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  });
  return fastify;
}
