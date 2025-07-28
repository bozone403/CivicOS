import express from 'express';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';
import pino from 'pino';

const logger = pino();
const router = express.Router();

// Initialize Stripe only if the secret key is provided
let Stripe: any = null;
let stripe: any = null;

if (process.env.STRIPE_SECRET_KEY) {
  try {
    Stripe = require('stripe');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });
  } catch (error) {
    logger.warn('Stripe import failed:', error);
  }
}

// Get donation total
router.get('/total', async (req, res) => {
  try {
    // For now, return a mock total since we don't have a donations table yet
    // In production, this would query the actual donations table
    const mockTotal = 12500; // $12,500 CAD raised so far
    
    res.json({
      success: true,
      total: mockTotal,
      currency: 'CAD'
    });
  } catch (error) {
    logger.error('Error fetching donation total:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donation total'
    });
  }
});

// Create payment intent for donation (handle both /donations/create-payment-intent and /create-payment-intent)
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid donation amount'
      });
    }

    // Validate amount (minimum $1, maximum $10,000)
    if (amount < 1 || amount > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Donation amount must be between $1 and $10,000 CAD'
      });
    }

    // Check if Stripe is properly configured
    if (!stripe) {
      logger.warn('Stripe not configured, returning simulated payment');
      return res.json({
        success: true,
        isSimulated: true,
        amount: amount,
        url: null,
        sessionId: null,
        message: 'Payment simulation mode - Stripe not configured'
      });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: 'CivicOS Platform Donation',
              description: `Support government transparency and platform operations`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_BASE_URL || 'https://civicos.ca'}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_BASE_URL || 'https://civicos.ca'}/donation-cancelled`,
      metadata: {
        type: 'donation',
        platform: 'civicos',
        amount: amount.toString(),
      },
    });

    logger.info('Created checkout session for donation', {
      amount: amount,
      sessionId: session.id
    });

    res.json({
      success: true,
      isSimulated: false,
      amount: amount,
      url: session.url,
      sessionId: session.id
    });

  } catch (error) {
    logger.error('Error creating checkout session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create checkout session'
      });
    }
  }
});

// Webhook to handle successful payments
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!stripe) {
      logger.warn('Stripe not configured, skipping webhook processing');
      return res.status(400).json({ error: 'Stripe not configured' });
    }
    
    if (!endpointSecret) {
      logger.warn('No webhook secret configured, skipping signature verification');
      event = req.body;
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
    }
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Log successful donation
        logger.info('Donation payment succeeded', {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency
        });

        // Here you would typically:
        // 1. Save the donation to your database
        // 2. Send confirmation email
        // 3. Update donation totals
        // 4. Trigger any post-donation actions

        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        logger.warn('Donation payment failed', {
          paymentIntentId: failedPayment.id,
          amount: failedPayment.amount / 100,
          currency: failedPayment.currency
        });

        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get donation history (for admin purposes)
router.get('/history', async (req, res) => {
  try {
    // For now, return mock data
    // In production, this would query the donations table
    const mockDonations = [
      {
        id: 1,
        amount: 50,
        currency: 'CAD',
        status: 'completed',
        date: new Date('2025-01-15').toISOString(),
        donorEmail: 'anonymous@example.com'
      },
      {
        id: 2,
        amount: 100,
        currency: 'CAD',
        status: 'completed',
        date: new Date('2025-01-20').toISOString(),
        donorEmail: 'anonymous@example.com'
      }
    ];

    res.json({
      success: true,
      donations: mockDonations,
      total: mockDonations.reduce((sum, d) => sum + d.amount, 0)
    });
  } catch (error) {
    logger.error('Error fetching donation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donation history'
    });
  }
});

export default router; 