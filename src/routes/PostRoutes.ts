import { FastifyInstance } from 'fastify';
import { createPostBodySchema } from '../Models/Post';
import {
  getAllPostsHandler,
  getSinglePostHandler,
  createPostHandler,
  updatePostHandler,
  deletePostHandler
} from '../Controllers/PostsControllers'; // Adjust path based on your folders

async function PostsRoutes(fastify: FastifyInstance) {
  // Get all posts
  fastify.get('/posts', getAllPostsHandler);

  // Get single post /:id
  fastify.get('/posts/:id', getSinglePostHandler);

  // Create a post
  fastify.post('/posts', { schema: { body: createPostBodySchema } }, createPostHandler);

  // Update a post
  fastify.put('/posts/:id', updatePostHandler);

  // Delete a post
  fastify.delete('/posts/:id', deletePostHandler);
}

export { PostsRoutes };