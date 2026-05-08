
// Fastify has built-in JSON Schema validation - no extra library needed
export const createUserSchema = {
  body: {
    type: 'object',
    required: ['username', 'email'], // These MUST exist
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email' },
      isActive: { type: 'boolean' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  },
};

export const updateUserSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  body: {
    type: 'object',
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email' },
      isActive: { type: 'boolean' },
    },
  },
};

// Schema for DELETE /users/:id
export const deleteUserSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
};

// Schema for GET /users/:id
export const getUserSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
};

