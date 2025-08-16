import { supabase } from './supabase';

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  email_notifications: boolean;
  credit_alerts: boolean;
  api_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund';
  description: string;
  stripe_payment_intent_id?: string;
  created_at: string;
}

export const settingsService = {
  // Get user settings
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }

    return data;
  },

  // Update user settings
  async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
      return null;
    }

    return data;
  },

  // Get user credit balance
  async getCreditBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('amount, type')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching credit balance:', error);
      return 0;
    }

    return data.reduce((balance, transaction) => {
      if (transaction.type === 'purchase' || transaction.type === 'refund') {
        return balance + transaction.amount;
      } else {
        return balance - transaction.amount;
      }
    }, 0);
  },

  // Get credit transaction history
  async getCreditHistory(userId: string): Promise<CreditTransaction[]> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching credit history:', error);
      return [];
    }

    return data || [];
  },

  // Create credit transaction
  async createCreditTransaction(transaction: Omit<CreditTransaction, 'id' | 'created_at'>): Promise<CreditTransaction | null> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        ...transaction,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating credit transaction:', error);
      return null;
    }

    return data;
  },

  // Get user usage statistics
  async getUserStats(userId: string): Promise<{
    totalModelsRun: number;
    creditsUsed: number;
    creditsPurchased: number;
    lastActivity: string | null;
  }> {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user stats:', error);
      return {
        totalModelsRun: 0,
        creditsUsed: 0,
        creditsPurchased: 0,
        lastActivity: null
      };
    }

    const usageTransactions = data.filter(t => t.type === 'usage');
    const purchaseTransactions = data.filter(t => t.type === 'purchase');
    const lastActivity = data.length > 0 ? data[0].created_at : null;

    return {
      totalModelsRun: usageTransactions.length,
      creditsUsed: usageTransactions.reduce((sum, t) => sum + t.amount, 0),
      creditsPurchased: purchaseTransactions.reduce((sum, t) => sum + t.amount, 0),
      lastActivity
    };
  }
}; 