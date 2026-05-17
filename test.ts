
import { eq } from 'drizzle-orm';
import { db } from './src/db/db';
import { orderItems, orders, posts, products, users } from './src/db/schema';



let QTY: number = 5
let userId: number = 4
let productId: number = 10

await db.transaction(async (tx) => {
    // 1. Used 'tx' (Correct)
    const product = await tx.select().from(products).where(eq(products.id, productId)).for('update')

    if (!product[0] || product[0].stock < QTY) {
        // Throwing an error here automatically rolls back the transaction in Drizzle
        throw new Error('Insufficient stock');
    }

    // 2. FIXED: Changed 'db' to 'tx'
    const order = await tx.insert(orders).values({
        userId,
        totalAmount: product[0].price * QTY,
        status: "Placed"
    }).returning()

    // 3. FIXED: Changed 'db' to 'tx'
    await tx.insert(orderItems).values({
        priceAtTime: product[0].price, // Double check: usually you want unit price here, not totalAmount!
        productId,
        quantity: QTY,
        orderId: order[0].id,
    })

    // 4. Don't forget to actually decrement the stock while you have it locked!
    await tx.update(products)
        .set({ stock: product[0].stock - QTY })
        .where(eq(products.id, productId))
})

console.log("operation successful ✅");
console.log("operation successfull ✅");