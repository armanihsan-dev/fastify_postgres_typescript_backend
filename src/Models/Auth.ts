import { Type } from '@sinclair/typebox';

const registerBodySchema = Type.Object({
  username: Type.String({ minLength: 3, maxLength: 50 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 6, maxLength: 200 }),
});

const loginBodySchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 1 }),
});

const authResponseSchema = Type.Object({
  success: Type.Boolean(),
  token: Type.Optional(Type.String()),
  user: Type.Optional(
    Type.Object({
      id: Type.Number(),
      username: Type.String(),
      email: Type.String(),
    })
  ),
  error: Type.Optional(Type.String()),
});
export { registerBodySchema, loginBodySchema, authResponseSchema };
