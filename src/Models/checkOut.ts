import { Type } from "@sinclair/typebox";



export const checkoutBodySchema = Type.Object({
    productId: Type.String(),
    quantity: Type.Number(),
})