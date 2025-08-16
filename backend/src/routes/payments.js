import express from 'express';
import { authenticateToken as auth } from '../middleware/auth.js';
import { supabase } from '../config/database.js';

// Initialize Stripe
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Credit packages configuration
const creditPackages = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 1000, // $10.00 in cents
    pricePerCredit: 10
  },
  popular: {
    id: 'popular',
    name: 'Popular Pack',
    credits: 500,
    price: 4500, // $45.00 in cents
    pricePerCredit: 9
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    credits: 1000,
    price: 8000, // $80.00 in cents
    pricePerCredit: 8
  }
};

// Create checkout session
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { packageId, userId } = req.body;

    if (!packageId || !userId) {
      return res.status(400).json({ error: 'Package ID and user ID are required' });
    }

    const package_ = creditPackages[packageId];
    if (!package_) {
      return res.status(400).json({ error: 'Invalid package ID' });
    }

    // Create checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: package_.name,
              description: `${package_.credits} credits`,
            },
            unit_amount: package_.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pricing`,
      metadata: {
        userId,
        packageId,
        credits: package_.credits
      }
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Add credits to user account
      try {
        const { userId, packageId, credits } = session.metadata;
        
        const { data: transaction, error: transactionError } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: parseInt(credits),
            type: 'purchase',
            description: `Purchased ${credits} credits via ${packageId} package`,
            stripe_payment_intent_id: session.payment_intent
          })
          .select()
          .single();

        if (transactionError) {
          console.error('Error creating credit transaction:', transactionError);
        } else {
          console.log('Credits added successfully:', transaction);
        }
      } catch (error) {
        console.error('Error processing webhook:', error);
      }
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get payment status
router.get('/status/:paymentIntentId', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

// Process successful payment
router.post('/process-success', auth, async (req, res) => {
  try {
    const { paymentIntentId, userId } = req.body;

    if (!paymentIntentId || !userId) {
      return res.status(400).json({ error: 'Payment intent ID and user ID are required' });
    }

    // Get payment intent details
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    const { packageId, credits } = paymentIntent.metadata;

    // Create credit transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: parseInt(credits),
        type: 'purchase',
        description: `Purchased ${credits} credits via ${packageId} package`,
        stripe_payment_intent_id: paymentIntentId
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating credit transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to process payment' });
    }

    res.json({
      success: true,
      transaction,
      creditsAdded: parseInt(credits)
    });
  } catch (error) {
    console.error('Error processing successful payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get user credit balance
router.get('/balance', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: transactions, error } = await supabase
      .from('credit_transactions')
      .select('amount, type')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching credit balance:', error);
      return res.status(500).json({ error: 'Failed to fetch credit balance' });
    }

    const balance = transactions.reduce((total, transaction) => {
      if (transaction.type === 'purchase' || transaction.type === 'refund') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 0);

    res.json({ balance });
  } catch (error) {
    console.error('Error getting credit balance:', error);
    res.status(500).json({ error: 'Failed to get credit balance' });
  }
});

// Get credit transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: transactions, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching credit history:', error);
      return res.status(500).json({ error: 'Failed to fetch credit history' });
    }

    res.json({ transactions: transactions || [] });
  } catch (error) {
    console.error('Error getting credit history:', error);
    res.status(500).json({ error: 'Failed to get credit history' });
  }
});



// Deduct credits for model usage
router.post('/deduct-credits', auth, async (req, res) => {
  try {
    const { userId, modelId, modelName, credits = 1 } = req.body;

    if (!userId || !modelId) {
      return res.status(400).json({ error: 'User ID and model ID are required' });
    }

    // Check if user has enough credits
    const { data: transactions, error: balanceError } = await supabase
      .from('credit_transactions')
      .select('amount, type')
      .eq('user_id', userId);

    if (balanceError) {
      console.error('Error checking credit balance:', balanceError);
      return res.status(500).json({ error: 'Failed to check credit balance' });
    }

    const currentBalance = transactions.reduce((total, transaction) => {
      if (transaction.type === 'purchase' || transaction.type === 'refund') {
        return total + transaction.amount;
      } else {
        return total - transaction.amount;
      }
    }, 0);

    if (currentBalance < credits) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Create usage transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: credits,
        type: 'usage',
        description: `Used ${credits} credit(s) for model: ${modelName || modelId}`
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating usage transaction:', transactionError);
      return res.status(500).json({ error: 'Failed to deduct credits' });
    }

    res.json({
      success: true,
      transaction,
      newBalance: currentBalance - credits
    });
  } catch (error) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ error: 'Failed to deduct credits' });
  }
});

export default router; 