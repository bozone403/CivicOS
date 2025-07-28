import Stripe from 'stripe';

// Initialize Stripe only if the secret key is provided
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    })
  : null;

export interface MembershipPricing {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export const MEMBERSHIP_PRICING: MembershipPricing[] = [
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

export async function createCustomer(email: string, name: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        source: 'civicos'
      }
    });
    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
}

export async function createSubscription(customerId: string, priceId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });
    return subscription;
  } catch (error) {
    console.error('Error creating Stripe subscription:', error);
    throw error;
  }
}

export async function createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
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
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
    });
    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

export async function createPaymentIntent(amount: number, currency: string = 'cad') {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        source: 'civicos'
      }
    });
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function getCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Error retrieving customer:', error);
    throw error;
  }
}

export async function updateCustomer(customerId: string, data: any) {
  try {
    const customer = await stripe.customers.update(customerId, data);
    return customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

export { stripe }; 