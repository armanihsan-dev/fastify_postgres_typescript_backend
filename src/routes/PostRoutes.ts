import { FastifyInstance } from 'fastify';
import { createPostBodySchema } from '../Models/Post';
import {
  getAllPostsHandler,
  getSinglePostHandler,
  createPostHandler,
  updatePostHandler,
  getAllPostsForATag,
  deletePostHandler,
  createPostWithTagsHandler
} from '../Controllers/PostsControllers'; // Adjust path based on your folders

async function PostsRoutes(fastify: FastifyInstance) {
  // Get all posts
  fastify.get('/posts', getAllPostsHandler);
  
  fastify.get('/tags/:tagSlug/posts', getAllPostsForATag)
  // Get single post /:id
  fastify.get('/posts/:id', getSinglePostHandler);

  // Create a post
  fastify.post('/posts', { schema: { body: createPostBodySchema } }, createPostHandler);

  //Create Post with Tags (One Request)
  fastify.post('/posts/tags', createPostWithTagsHandler)

  // Update a post
  fastify.put('/posts/:id', updatePostHandler);

  // Delete a post
  fastify.delete('/posts/:id', deletePostHandler);
}

export { PostsRoutes };