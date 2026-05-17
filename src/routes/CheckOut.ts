import { FastifyInstance } from 'fastify';
import { checkoutBodySchema } from '../Models/checkOut';
import {
    handleCheckout,
    getCheckoutProducts,
    getSingleProduct
} from '../Controllers/CheckoutControllers'; // Update path to your controller folder

async function checkoutRoutes(fastify: FastifyInstance) {
    // Post checkout items
    fastify.post('/checkout', { schema: checkoutBodySchema }, handleCheckout);

    // Get all products for checkout
    fastify.get('/checkout/products', getCheckoutProducts);

    // Get a specific product by ID
    fastify.get('/products/:productId', getSingleProduct);
}

export { checkoutRoutes };