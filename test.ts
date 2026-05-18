import { and, eq, sql } from 'drizzle-orm';
import { db } from './src/db/db';
import { users } from './src/db/schema';
import { relDuration } from 'drizzle-orm/gel-core';
import test from 'node:test';

// const dummyUsers = Array.from({ length: 10000 }, (_, i) => ({
//     email: `fancy${i - 1}-m@example.com`,
//     username: `User ${i}`,
//     age: 20 + (i % 40),
//     isActive: Math.floor(Math.random() * 20) > 10 ? true : false,
//     passwordHash: "$2b$10$NAv3VwC6Z4x92kfpSBVWVuZBkLOzB15GbX08wOp4jFHB6psnSle7y"
// }));


let test_email: string = 'fancy9926-m@example.com'
async function testQueryPerformance() {
    const startnoindex = Date.now()
    const user = await db.select().from(users).where(eq(users.email, test_email))
    const endnoindex = Date.now()
    console.log(`Query Wihout  index ${endnoindex - startnoindex}ms`);



    console.log('\nCreating index');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS email_idx ON users(email)`)


    const startWihtindex = Date.now()
    const userWithIndex = await db.select().from(users).where(eq(users.email, test_email))
    const endWithindex = Date.now()
    console.log(`Query Wihout  index ${endWithindex - startWihtindex}ms`);

    const imporv = ((endnoindex - startnoindex) / (endWithindex - startWihtindex)).toFixed(2)
    console.log(`Improvement: ${imporv}x`);
}
testQueryPerformance()