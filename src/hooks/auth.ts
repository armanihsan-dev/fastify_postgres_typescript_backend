import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { relative } from 'node:path';
import { runInThisContext } from 'node:vm';

type reqUser = {
  id: number;
  email: string;
  username: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: reqUser
  }
}


export async function setupAuthHook(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {

    const publicRoutes = [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/health',
      '/docs',
      '/documentation'
    ];

    const isPublicRoute = publicRoutes.some(route =>
      request.url.startsWith(route)
    )

    if (isPublicRoute) return

    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return reply.status(401).send({
        success: false,
        error: 'Missing or invalid authorization token'
      });
    }

    const token = authHeader.slice(7)  // Remove 'Bearer ' prefix
    try {
      const decoded = fastify.jwt.decode(token)
      request.user = decoded as reqUser
    } catch (err) {
      throw err
    }
  })
}