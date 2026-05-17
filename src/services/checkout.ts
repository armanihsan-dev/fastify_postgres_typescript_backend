import { eq, inArray } from "drizzle-orm";
import { db } from "../db/db";
import { orderItems, orders, products } from "../db/schema";



interface CheckoutRequest {
  userId: number;
  items: CartItem[];
}
export async function checkout({ userId, items }: CheckoutRequest) {

  //start transaction
  return db.transaction(async (tx) => {
    const productids = items.map((item) => item.productId)

    const productlist = await tx.select().from(products).where(inArray(products.id, productids)).for('update') // ← Locks ALL these product rows

    let totalAmount: number = 0
    const orderItemsToInsert = []

    for (const item of items) {
      const product = productlist.find((product) => product.id == item.productId)

      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`)
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
      }

      let ItemTotal = product.price * item.quantity
      totalAmount += ItemTotal

      orderItemsToInsert.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: product.price,
      })
    }

    const [newOrder] = await tx.insert(orders).values({
      userId,
      totalAmount,
      status: 'Pending'
    }).returning()

    for (const item of orderItemsToInsert) {
      await tx.insert(orderItems).values({
        orderId: newOrder.id,
        priceAtTime: item.priceAtTime,
        quantity: item.quantity,
        productId: item.productId
      })
    }


    //Deduct stock for each product

    for (const item of items) {
      const product = productlist.find((product) => product.id == item.productId)

      await tx.update(products).set({
        stock: product!.stock - item.quantity
      }).where(eq(products.id, item.productId))
    }

    const [completedOrder] = await tx.update(orders).set({ status: "Completed" }).where(eq(orders.id, newOrder.id)).returning()
    return {
      success: true,
      orderId: completedOrder.id,
      totalAmount: completedOrder.totalAmount,
      message: 'Order placed successfully!'
    };
  })
}