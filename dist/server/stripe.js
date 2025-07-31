// Only import Stripe if the secret key is provided
let Stripe = null;
let stripe = null;
// Initialize Stripe lazily when needed
async function initializeStripe() {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn('Stripe not configured - payment features disabled');
        return null;
    }
    try {
        const stripeModule = await import('stripe');
        const StripeClass = stripeModule.default;
        return new StripeClass(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-05-28.basil',
        });
    }
    catch (error) {
        console.warn('Stripe import failed:', error);
        return null;
    }
}
export const MEMBERSHIP_PRICING = [
    {
        id: 'citizen',
        name: 'Citizen',
        priceMonthly: 0,
        priceYearly: 0,
    },
    {
        id: 'press',
        name: 'Press',
        priceMonthly: 29.99,
        priceYearly: 299.99,
        stripePriceIdMonthly: 'price_press_monthly',
        stripePriceIdYearly: 'price_press_yearly',
    },
    {
        id: 'government',
        name: 'Government',
        priceMonthly: 49.99,
        priceYearly: 499.99,
        stripePriceIdMonthly: 'price_gov_monthly',
        stripePriceIdYearly: 'price_gov_yearly',
    },
];
export async function createCustomer(email, name) {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
        const customer = await stripeInstance.customers.create({
            email,
            name,
            metadata: {
                source: 'civicos'
            }
        });
        return customer;
    }
    catch (error) {
        console.error('Error creating Stripe customer:', error);
        throw error;
    }
}
export async function createSubscription(customerId, priceId) {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
        const subscription = await stripeInstance.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
        });
        return subscription;
    }
    catch (error) {
        console.error('Error creating Stripe subscription:', error);
        throw error;
    }
}
export async function createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
        const session = await stripeInstance.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                source: 'civicos'
            }
        });
        return session;
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}
export async function getSubscription(subscriptionId) {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
        const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
        return subscription;
    }
    catch (error) {
        console.error('Error retrieving subscription:', error);
        throw error;
    }
}
export async function cancelSubscription(subscriptionId) {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
        const subscription = await stripeInstance.subscriptions.cancel(subscriptionId);
        return subscription;
    }
    catch (error) {
        console.error('Error canceling subscription:', error);
        throw error;
    }
}
export async function updateSubscription(subscriptionId, newPriceId) {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
        const subscription = await stripeInstance.subscriptions.retrieve(subscriptionId);
        const updatedSubscription = await stripeInstance.subscriptions.update(subscriptionId, {
            items: [
                {
                    id: subscription.items.data[0].id,
                    price: newPriceId,
                },
            ],
        });
        return updatedSubscription;
    }
    catch (error) {
        console.error('Error updating subscription:', error);
        throw error;
    }
}
export async function createPaymentIntent(amount, currency = 'cad') {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
        const paymentIntent = await stripeInstance.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            metadata: {
                source: 'civicos'
            }
        });
        return paymentIntent;
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
}
export async function getCustomer(customerId) {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
        const customer = await stripeInstance.customers.retrieve(customerId);
        return customer;
    }
    catch (error) {
        console.error('Error retrieving customer:', error);
        throw error;
    }
}
export async function updateCustomer(customerId, data) {
    const stripeInstance = await initializeStripe();
    if (!stripeInstance) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }
    try {
        const customer = await stripeInstance.customers.update(customerId, data);
        return customer;
    }
    catch (error) {
        console.error('Error updating customer:', error);
        throw error;
    }
}
// Stripe is now initialized lazily when needed 
