import { FastifyInstance } from 'fastify';
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
} from '../Controllers/UserControllers';

export async function userRoutes(fastify: FastifyInstance) {
  // GET Route: Get all users
  fastify.get('/users', getAllUsers);

  // GET Route: Get user by ID
  fastify.get('/users/:id', getUserById);
  fastify.get('/users/paginated', getUserWithPagination);
  // GET Route: Search by username
  fastify.get('/users/search', searchUsersByUsername);

  // GET Route: Search by email
  fastify.get('/users/email', searchUsersByEmail);

  // POST Route: Create new user
  fastify.post('/users', { schema: createUserSchema }, createUser);

  // PUT Route: Update user
  fastify.put('/users/:id', { schema: updateUserSchema }, updateUser);

  // DELETE Route: Delete user
  fastify.delete('/users/:id', { schema: deleteUserSchema }, deleteUser);
}
