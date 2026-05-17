import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/db';
import { products } from '../db/schema';
import { checkout } from '../services/checkout';
import { eq } from 'drizzle-orm';



export interface checkOutBody {
    items: CartItem[];
}

export const handleCheckout = async (
    request: FastifyRequest<{ Body: checkOutBody }>,
    reply: FastifyReply
) => {
    const userId = request.user?.id;
    const { items } = request.body;

    try {
        const result = await checkout({ userId, items });
        return reply.status(200).send({
            success: true,
            data: result
        });
    } catch (err: any) {
        if (err.message?.includes('Insufficient stock')) {
            return reply.status(409).send({
                success: false,
                error: err.message
            });
        }
        return reply.status(500).send({
            success: false,
            error: 'Checkout failed'
        });
    }
};

export const getCheckoutProducts = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const productlist = await db.select().from(products);
        return reply.status(200).send({
            success: true,
            data: productlist
        });
    } catch (err) {
        throw err;
    }
};

export const getSingleProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { productId } = request.params as { productId: string };

        // Fixed: Using standard Drizzle eq(col, val) syntax
        const productList = await db.select().from(products).where(eq(products.id, parseInt(productId)));
        const product = productList[0];

        if (!product) {
            return reply.status(404).send({
                success: false,
                error: 'Product not found'
            });
        }

        return reply.status(200).send({
            success: true,
            data: product
        });
    } catch (err) {
        throw err;
    }
};