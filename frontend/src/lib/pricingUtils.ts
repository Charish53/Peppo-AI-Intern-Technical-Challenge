// Utility functions for pricing display and formatting

export interface PricingInfo {
  price: number;
  currency: string;
  pricing_type: 'free' | 'one_time' | 'subscription' | 'pay_per_use';
  trial_period_days?: number;
  credits_per_run?: number;
  credits_per_use?: number;
}

// Format price with currency symbol
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
  };

  const symbol = currencySymbols[currency] || currency;
  
  if (price === 0) {
    return 'Free';
  }
  
  return `${symbol}${price.toFixed(2)}`;
};

// Get pricing display text
export const getPricingDisplay = (pricing: PricingInfo): string => {
  const { price, currency, pricing_type, trial_period_days, credits_per_run, credits_per_use } = pricing;
  
  // For all models, show credits_per_use as the price
  if (credits_per_use && credits_per_use > 0) {
    return `${credits_per_use} credits`;
  }
  
  // Fallback to original logic if credits_per_use is not available
  if (pricing_type === 'free') {
    const creditsText = credits_per_run && credits_per_run > 1 
      ? ` (${credits_per_run} credits)` 
      : '';
    return `Free${creditsText}`;
  }
  
  const priceText = formatPrice(price, currency);
  
  switch (pricing_type) {
    case 'one_time':
      return `${priceText} (one-time)`;
    case 'subscription':
      const trialText = trial_period_days && trial_period_days > 0 
        ? ` (${trial_period_days}-day trial)` 
        : '';
      return `${priceText}/month${trialText}`;
    case 'pay_per_use':
      const creditsText = credits_per_run && credits_per_run > 1 
        ? ` (${credits_per_run} credits)` 
        : '';
      return `${priceText} per use${creditsText}`;
    default:
      return priceText;
  }
};

// Get pricing badge variant
export const getPricingBadgeVariant = (pricing_type: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (pricing_type) {
    case 'free':
      return 'secondary';
    case 'one_time':
      return 'default';
    case 'subscription':
      return 'outline';
    case 'pay_per_use':
      return 'default';
    default:
      return 'secondary';
  }
};

// Check if model has trial
export const hasTrial = (pricing: PricingInfo): boolean => {
  return pricing.pricing_type === 'subscription' && 
         pricing.trial_period_days !== undefined && 
         pricing.trial_period_days > 0;
};

// Get trial text
export const getTrialText = (trial_period_days: number): string => {
  if (trial_period_days === 1) {
    return '1 day free trial';
  } else if (trial_period_days < 30) {
    return `${trial_period_days} days free trial`;
  } else if (trial_period_days === 30) {
    return '30 days free trial';
  } else {
    const months = Math.floor(trial_period_days / 30);
    const days = trial_period_days % 30;
    if (days === 0) {
      return `${months} month${months > 1 ? 's' : ''} free trial`;
    } else {
      return `${months} month${months > 1 ? 's' : ''} ${days} day${days > 1 ? 's' : ''} free trial`;
    }
  }
}; 