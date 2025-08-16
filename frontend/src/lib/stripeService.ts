import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const initializeStripe = (publishableKey: string) => {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 1000, // $10.00 in cents
    pricePerCredit: 10, // $0.10 in cents
    description: 'Perfect for trying out different models',
    features: [
      '100 credits',
      'Access to all models',
      'Standard processing speed',
      'Email support',
      'Valid for 1 year'
    ]
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 500,
    price: 4500, // $45.00 in cents
    pricePerCredit: 9, // $0.09 in cents
    description: 'Most popular choice for regular users',
    features: [
      '500 credits',
      'Priority processing',
      'Access to all models',
      'Email support',
      'Valid for 1 year',
      '10% discount'
    ],
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 1000,
    price: 8000, // $80.00 in cents
    pricePerCredit: 8, // $0.08 in cents
    description: 'Best value for power users',
    features: [
      '1000 credits',
      'Priority processing',
      'Access to all models',
      'Priority support',
      'Valid for 1 year',
      '20% discount',
      'API access included'
    ]
  }
];

export const stripeService = {
  // Create a checkout session
  async createCheckoutSession(packageId: string, userId: string): Promise<{ sessionId: string; url: string } | null> {
    try {
      // Get the current session to get the JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId,
          userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return {
        sessionId: data.sessionId,
        url: data.url
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return null;
    }
  },

  // Confirm payment
  async confirmPayment(clientSecret: string, paymentMethodId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: 'Payment confirmation failed' };
    }
  },

  // Get payment status
  async getPaymentStatus(paymentIntentId: string): Promise<{ status: string; amount: number } | null> {
    try {
      // Get the current session to get the JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/payments/status/${paymentIntentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting payment status:', error);
      return null;
    }
  },

  // Process successful payment
  async processSuccessfulPayment(paymentIntentId: string, userId: string): Promise<boolean> {
    try {
      // Get the current session to get the JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/payments/process-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentIntentId,
          userId
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error processing successful payment:', error);
      return false;
    }
  },


}; 