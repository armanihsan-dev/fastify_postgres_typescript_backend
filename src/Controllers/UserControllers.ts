import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/db';
import { users } from '../db/schema';
import { asc, eq, ilike } from 'drizzle-orm';
import { requestBody } from '../routes/UserRoutes';

// Interface definitions
interface UserParams {
  id: string;
}
export type GetUsersQuery = Partial<{
  limit: string;
  offset: string;
  page: string;
}>;

interface CreateUserBody {
  username: string;
  email: string;
  isActive?: boolean;
}

interface UpdateUserBody {
  username?: string;
  email?: string;
  isActive?: boolean;
}

// GET all users
export const getAllUsers = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  console.log('get all users from pre handler', request.user);
  const allUsers = await db.select().from(users);
  reply.send({ success: true, count: allUsers.length, data: allUsers });
};

export const getUserWithPagination = async (
  request: FastifyRequest<{ Querystring: GetUsersQuery }>,
  reply: FastifyReply
) => {
  try {
    const limit = parseInt(request.query.limit || '1');
    const page = parseInt(request.query.page || '1');
    const offset = (page - 1) * limit;

    const allUsers = await db
      .select()
      .from(users)
      .orderBy(asc(users.id))
      .limit(limit)
      .offset(offset);

    reply.send({
      success: true,
      method: 'drizzle-orm',
      users: allUsers,
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ success: false, error: 'Failed to fetch user' });
  }
};
// GET user by ID
export const getUserById = async (
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)));

    if (user.length === 0) {
      return reply.status(404).send({
        success: false,
        error: `User with id ${id} not found`,
      });
    }

    reply.status(200).send({
      success: true,
      method: 'drizzle-orm',
      data: user[0],
    });
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({ success: false, error: 'Failed to fetch user' });
  }
};

// Search users by username
export const searchUsersByUsername = async (
  request: FastifyRequest<{ Querystring: { username: string } }>,
  reply: FastifyReply
) => {
  try {
    const { username } = request.query;
    if (!username) {
      return reply.status(400).send({
        success: false,
        error: 'username query parameter is required',
      });
    }
    const result = await db
      .select()
      .from(users)
      .where(ilike(users.username, `%${username}%`))
      .orderBy(users.id);

    reply.status(200).send({
      success: true,
      method: 'drizzle-orm',
      count: result.length,
      data: result,
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ success: false, error: 'Search failed' });
  }
};

// Search users by email
export const searchUsersByEmail = async (
  request: FastifyRequest<{ Querystring: { useremail: string } }>,
  reply: FastifyReply
) => {
  try {
    const { useremail } = request.query;
    if (!useremail) {
      return reply.status(400).send({
        success: false,
        error: 'email query parameter is required',
      });
    }
    const result = await db
      .select()
      .from(users)
      .where(ilike(users.email, `%${useremail}%`))
      .orderBy(users.id);

    reply.status(200).send({
      success: true,
      method: 'drizzle-orm',
      count: result.length,
      data: result,
    });
  } catch (err) {
    request.log.error(err);
    reply.status(500).send({ success: false, error: 'Search failed' });
  }
};

// CREATE new user
export const createUser = async (
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
) => {
  const { username, email, isActive } = request.body;

  try {
    const newUser = await db
      .insert(users)
      .values({
        username,
        email,
        isActive: isActive ?? true,
      })
      .returning();

    reply.status(201).send({
      success: true,
      method: 'drizzle-orm',
      data: newUser[0],
    });
  } catch (err: any) {
    if (err.code === '23505') {
      return reply.status(409).send({
        success: false,
        error: 'Email already exists',
      });
    }
    request.log.error(err);
    reply.status(500).send({
      success: false,
      error: 'Failed to create user',
    });
  }
};

// UPDATE user
export const updateUser = async (
  request: FastifyRequest<{ Body: UpdateUserBody; Params: UserParams }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const { username, email, isActive } = request.body;

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(id)));

    if (existingUser.length === 0) {
      return reply.status(404).send({
        success: false,
        error: `User with id ${id} not found`,
      });
    }

    const updateUser: Partial<typeof users.$inferInsert> = {};
    if (username !== undefined) updateUser.username = username;
    if (email !== undefined) updateUser.email = email;
    if (isActive !== undefined) updateUser.isActive = isActive;

    const updatedUser = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, Number(id)))
      .returning();

    reply.send({
      success: true,
      method: 'drizzle-orm',
      data: updatedUser[0],
    });
  } catch (err: any) {
    if (err.code === '23505') {
      return reply.status(409).send({
        success: false,
        error: 'Email already exists',
      });
    }
    request.log.error(err);
    reply.status(500).send({
      success: false,
      error: 'Failed to update user',
    });
  }
};

// DELETE user
export const deleteUser = async (
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    const deleted = await db
      .delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return reply.status(404).send({
        success: false,
        error: `User with id ${id} not found`,
      });
    }

    reply.status(200).send({
      success: true,
      message: `User ${id} deleted successfully`,
      data: deleted[0],
    });
  } catch (err: any) {
    if (err.code === '23505') {
      return reply.status(409).send({
        success: false,
        error: 'Cannot delete user with existing references',
      });
    }
    request.log.error(err);
    reply.status(500).send({
      success: false,
      error: 'Failed to delete user',
    });
  }
};
