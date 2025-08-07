import Stripe from 'stripe';
import { db } from "../db.js";
import { users, userMembershipHistory } from "../../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";
import pino from "pino";
import jwt from "jsonwebtoken";
import { jwtAuth } from "./auth.js";
import { createCustomer, createCheckoutSession, cancelSubscription, MEMBERSHIP_PRICING } from "../stripe.js";

const logger = pino();

export function registerMembershipRoutes(app) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Get membership types and pricing
  app.get("/api/membership/types", async (req, res) => {
    try {
      res.json({
        success: true,
        membershipTypes: MEMBERSHIP_PRICING
      });
    }
    catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch membership types",
        error: error?.message || String(error)
      });
    }
  });

  // Create checkout session for membership upgrade
  app.post("/api/membership/checkout", jwtAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { membershipType, billingCycle } = req.body;
      if (!membershipType || !billingCycle) {
        return res.status(400).json({
          message: "membershipType and billingCycle are required"
        });
      }
      // Get user
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userResult[0];
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Find membership pricing
      const membership = MEMBERSHIP_PRICING.find(m => m.id === membershipType);
      if (!membership) {
        return res.status(400).json({ message: "Invalid membership type" });
      }
      // Citizen membership is free
      if (membershipType === 'citizen') {
        // Update user membership directly
        await db.update(users)
          .set({
            membershipType: 'citizen',
            membershipStatus: 'active',
            membershipStartDate: new Date(),
            accessLevel: 'basic',
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
        // Record membership history
        await db.insert(userMembershipHistory).values({
          userId: userId,
          membershipType: 'citizen',
          status: 'active',
          startDate: new Date(),
          amountPaid: "0.00",
          paymentMethod: 'free',
          notes: 'Free citizen membership'
        });
        return res.json({
          success: true,
          message: "Citizen membership activated successfully",
          membershipType: 'citizen',
          accessLevel: 'basic'
        });
      }
      // For paid memberships, create Stripe checkout session
      const priceId = billingCycle === 'yearly'
        ? membership.stripePriceIdYearly
        : membership.stripePriceIdMonthly;
      if (!priceId) {
        return res.status(400).json({
          message: "Stripe price ID not configured for this membership"
        });
      }
      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await createCustomer(user.email || '', `${user.firstName || ''} ${user.lastName || ''}`);
        stripeCustomerId = customer.id;
        // Update user with Stripe customer ID
        await db.update(users)
          .set({ stripeCustomerId })
          .where(eq(users.id, userId));
      }
      // Create checkout session
      const successUrl = `${process.env.FRONTEND_BASE_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${process.env.FRONTEND_BASE_URL}/membership/cancel`;
      const session = await createCheckoutSession(stripeCustomerId, priceId, successUrl, cancelUrl);
      res.json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id
      });
    }
    catch (error) {
      // console.error removed for production
      res.status(500).json({
        success: false,
        message: "Failed to create checkout session",
        error: error?.message || String(error)
      });
    }
  });

  // Webhook endpoint for Stripe events
  app.post("/api/membership/webhook", async (req, res) => {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        return res.status(400).json({ message: "Missing signature or webhook secret" });
      }
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      // Handle the event
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscriptionUpdate(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionCancellation(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await handlePaymentSuccess(event.data.object);
          break;
        case 'invoice.payment_failed':
          await handlePaymentFailure(event.data.object);
          break;
        default:
          // console.log removed for production
      }
      res.json({ received: true });
    }
    catch (error) {
      // console.error removed for production
      res.status(400).json({ message: "Webhook error" });
    }
  });

  // Get user's current membership status
  app.get("/api/membership/status", jwtAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userResult[0];
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Get membership history
      const historyResult = await db.select()
        .from(userMembershipHistory)
        .where(eq(userMembershipHistory.userId, userId))
        .orderBy(userMembershipHistory.startDate);
      res.json({
        success: true,
        membership: {
          type: user.membershipType,
          status: user.membershipStatus,
          accessLevel: user.accessLevel,
          startDate: user.membershipStartDate,
          endDate: user.membershipEndDate,
          stripeCustomerId: user.stripeCustomerId,
          stripeSubscriptionId: user.stripeSubscriptionId
        },
        history: historyResult
      });
    }
    catch (error) {
      // console.error removed for production
      res.status(500).json({
        success: false,
        message: "Failed to get membership status",
        error: error?.message || String(error)
      });
    }
  });

  // Cancel membership
  app.post("/api/membership/cancel", jwtAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userResult[0];
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.membershipType === 'citizen') {
        return res.status(400).json({ message: "Citizen membership cannot be cancelled" });
      }
      if (user.stripeSubscriptionId) {
        // Cancel Stripe subscription
        await cancelSubscription(user.stripeSubscriptionId);
      }
      // Update user membership status
      await db.update(users)
        .set({
          membershipStatus: 'cancelled',
          membershipEndDate: new Date(),
          accessLevel: 'basic',
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      // Record cancellation in history
      await db.insert(userMembershipHistory).values({
        userId: userId,
        membershipType: user.membershipType || 'citizen',
        status: 'cancelled',
        startDate: user.membershipStartDate || new Date(),
        endDate: new Date(),
        stripeSubscriptionId: user.stripeSubscriptionId,
        amountPaid: "0.00",
        paymentMethod: 'cancelled',
        notes: 'Membership cancelled by user'
      });
      res.json({
        success: true,
        message: "Membership cancelled successfully"
      });
    }
    catch (error) {
      // console.error removed for production
      res.status(500).json({
        success: false,
        message: "Failed to cancel membership",
        error: error?.message || String(error)
      });
    }
  });
}
// Helper functions for webhook handling
async function handleSubscriptionUpdate(subscription) {
  try {
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;
    const status = subscription.status;
    // Find user by Stripe customer ID
    const userResult = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    const user = userResult[0];
    if (!user) {
      // console.error removed for production
      return;
    }
    // Determine membership type from price ID
    const priceId = subscription.items.data[0].price.id;
    let membershipType = 'citizen';
    let accessLevel = 'basic';
    if (priceId.includes('press')) {
      membershipType = 'press';
      accessLevel = 'press';
    }
    else if (priceId.includes('gov')) {
      membershipType = 'government';
      accessLevel = 'government';
    }
    // Update user membership
    await db.update(users)
      .set({
        membershipType,
        membershipStatus: status === 'active' ? 'active' : 'inactive',
        membershipStartDate: new Date(subscription.start_date * 1000),
        membershipEndDate: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        stripeSubscriptionId: subscriptionId,
        accessLevel,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
    // Record in history
    await db.insert(userMembershipHistory).values({
      userId: user.id,
      membershipType,
      status: status === 'active' ? 'active' : 'inactive',
      startDate: new Date(subscription.start_date * 1000),
      endDate: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      stripeSubscriptionId: subscriptionId,
      amountPaid: String(subscription.items.data[0].price.unit_amount / 100),
      paymentMethod: 'stripe',
      notes: `Subscription ${status}`
    });
  }
  catch (error) {
    // console.error removed for production
  }
}
async function handleSubscriptionCancellation(subscription) {
  try {
    const subscriptionId = subscription.id;
    // Find user by subscription ID
    const userResult = await db.select().from(users).where(eq(users.stripeSubscriptionId, subscriptionId)).limit(1);
    const user = userResult[0];
    if (!user) {
      // console.error removed for production
      return;
    }
    // Update user membership
    await db.update(users)
      .set({
        membershipStatus: 'cancelled',
        membershipEndDate: new Date(),
        accessLevel: 'basic',
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
  }
  catch (error) {
    // console.error removed for production
  }
}
async function handlePaymentSuccess(invoice) {
  try {
    const customerId = invoice.customer;
    // Find user by Stripe customer ID
    const userResult = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    const user = userResult[0];
    if (!user) {
      // console.error removed for production
      return;
    }
    // Update user membership status
    await db.update(users)
      .set({
        membershipStatus: 'active',
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
  }
  catch (error) {
    // console.error removed for production
  }
}
async function handlePaymentFailure(invoice) {
  try {
    const customerId = invoice.customer;
    // Find user by Stripe customer ID
    const userResult = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
    const user = userResult[0];
    if (!user) {
      // console.error removed for production
      return;
    }
    // Update user membership status
    await db.update(users)
      .set({
        membershipStatus: 'inactive',
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));
  }
  catch (error) {
    // console.error removed for production
  }
}
