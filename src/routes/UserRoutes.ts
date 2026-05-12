import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  createUserSchema,
  deleteUserSchema,
  updateUserSchema,
} from '../Models/User';
import {
  getAllUsers,
  getUserById,
  searchUsersByUsername,
  searchUsersByEmail,
  createUser,
  updateUser,
  deleteUser,
  getUserWithPagination,
  GetUsersQuery,
} from '../Controllers/UserControllers';

export type requestBody = {
  createdAt: string;
};
export async function userRoutes(fastify: FastifyInstance) {
  // fastify.addHook(
  //   'onRequest',
  //   async (req: FastifyRequest, replay: FastifyReply) => {
  //     console.log(`Incoming request: ${req.method} ${req.url}`);

  //     console.log('Client Ip:', req.ip);
  //   }
  // );

  // fastify.addHook(
  //   'preValidation',
  //   async (
  //     request: FastifyRequest<{
  //       Querystring: GetUsersQuery;
  //       Body: requestBody;
  //     }>,
  //     replay: FastifyReply
  //   ) => {
  //     if (!request.query.page) {
  //       request.query.page = '1';
  //     }

  //     if (request.query.limit) {
  //       request.query.limit = parseInt(request.query.limit).toString();
  //     }

  //     if (request.method !== 'GET' && request.body && !request.body.createdAt) {
  //       request.body.createdAt = new Date().toISOString();
  //     }
  //   }
  // );

  // GET Route: Get all users
  fastify.get('/users', getAllUsers);
  fastify.get('/users/paginated', getUserWithPagination);
  fastify.get('/users/search', searchUsersByUsername);
  fastify.get('/users/email', searchUsersByEmail);

  // GET Route: Get user by ID (parametric - must be last)
  fastify.get('/users/:id', getUserById);

  // POST Route: Create new user
  fastify.post('/users', { schema: createUserSchema }, createUser);

  fastify.post(
    '/posting',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as { email: string };
      console.log(request.user);
      return reply.status(200).send(request.user);
    }
  );

  // PUT Route: Update user
  fastify.put('/users/:id', { schema: updateUserSchema }, updateUser);

  // DELETE Route: Delete user
  fastify.delete('/users/:id', { schema: deleteUserSchema }, deleteUser);
}
