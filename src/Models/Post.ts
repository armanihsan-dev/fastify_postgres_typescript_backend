import { Static, Type } from "@sinclair/typebox";


export const createPostBodySchema = Type.Object({
    title: Type.String({ minLength: 3, maxLength: 100 }),
    content: Type.String({ minLength: 1, maxLength: 5000 }),
    published: Type.Optional(Type.Boolean()),
})

export type createPostBody = Static<typeof createPostBodySchema>
