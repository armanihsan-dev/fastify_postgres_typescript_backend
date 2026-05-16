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
  // GET Route: Get all users
  fastify.get('/users', getAllUsers);
  fastify.get('/users/paginated', getUserWithPagination);
  fastify.get('/users/search', searchUsersByUsername);
  fastify.get('/users/email', searchUsersByEmail);

  // GET Route: Get user by ID (parametric - must be last)
  fastify.get('/users/:id', getUserById);

  // POST Route: Create new user
  fastify.post('/users', { schema: createUserSchema }, createUser);


  // PUT Route: Update user
  fastify.put('/users/:id', { schema: updateUserSchema }, updateUser);

  // DELETE Route: Delete user
  fastify.delete('/users/:id', { schema: deleteUserSchema }, deleteUser);
}
