import { eq } from 'drizzle-orm';
import { db } from './src/db/db';
import { Type, Static } from '@sinclair/typebox';
import { posts, users } from './src/db/schema';

type testTypes = {
  title: string;
  content: string;
  userId: number;
};

async function update({ title, content, userId }: testTypes) {
  await db
    .update(posts)
    .set({
      title,
      content,
      userId,
    })
    .where(eq(posts.id, 5));
}
const insert = async ({ title, content, userId }: testTypes) => {
  const result = await db.insert(posts).values({
    title,
    content,
    userId,
  });
};
async function deleteTest(id: number) {
  const result = await db.delete(users).where(eq(users.id, id));
  return result;
}

async function getAll() {
  const result = await db.query.users.findFirst({
    where: eq(users.id, 2),
    with: {
      posts: true,
    },
  });
  return result;
}

async function innerJoin() {
  const data = await db
    .select({
      postId: posts.id,
      Title: posts.title,
      authorID: users.id,
      authorName: users.username,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id));
  return data;
}

async function leftJoin() {
  const data = await db
    .select({
      userId: users.id,
      username: users.username,
      postTitle: posts.title,
    })
    .from(users)
    .leftJoin(posts, eq(users.id, posts.userId));

  return data;
}
// console.log(await leftJoin());
//console.log(await innerJoin());
//console.log(await getAll());

// const result = await update({
//   title: 'Munnu posting someting',
//   content: 'Hi, Im munny, doing all the prayers',
//   userId: 6,
// });
// console.log(result);

// const insertResult = await insert({
//   title: 'another post by u2',
//   content: 'hiii,, how are you ',
//   userId: 2,
// });
//console.log(insertResult);

// const result = await deleteTest(2);
// console.log(result);
console.log('✅ Successfully queried');

const userSchema = Type.Object({
  name: Type.String(),
  age: Type.Number(),
  email: Type.String(),
});

type userObj = Static<typeof userSchema>;

const obj: userObj = {
  name: 'John Doe',
  age: 30,
  email: 'ahi',
};

interface FastifyRequestt {
  url: string;
  method: string;
  headers: object;
}
