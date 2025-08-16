import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, User, Settings, LogOut, Bell, Shield, CreditCard as CreditCardIcon, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { settingsService, UserSettings } from '@/lib/settingsService';
import { stripeService, creditPackages } from '@/lib/stripeService';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for different sections
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalModelsRun: 0,
    creditsUsed: 0,
    creditsPurchased: 0,
    lastActivity: null as string | null
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [settings, balance, history, stats] = await Promise.all([
        settingsService.getUserSettings(user.id),
        settingsService.getCreditBalance(user.id),
        settingsService.getCreditHistory(user.id),
        settingsService.getUserStats(user.id)
      ]);

      setUserSettings(settings);
      setCreditBalance(balance);
      setCreditHistory(history);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !userSettings) return;
    
    setSaving(true);
    try {
      const updatedSettings = await settingsService.updateUserSettings(user.id, updates);
      if (updatedSettings) {
        setUserSettings(updatedSettings);
        toast.success('Settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePurchaseCredits = async (packageId: string) => {
    if (!user) return;
    
    try {
      // Create payment intent
      const paymentIntent = await stripeService.createPaymentIntent(packageId, user.id);
      if (!paymentIntent) {
        toast.error('Failed to create payment intent');
        return;
      }

      // For now, simulate successful payment
      // In a real implementation, you would integrate with Stripe Elements
      toast.success('Payment processing...');
      
      // Simulate successful payment processing
      const success = await stripeService.processSuccessfulPayment(paymentIntent.paymentIntentId, user.id);
      if (success) {
        toast.success('Credits purchased successfully!');
        loadUserData(); // Reload user data
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast.error('Failed to purchase credits');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <div className="flex-1 py-12 px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-medium tracking-tighter">Settings</h1>
            <p className="text-lg text-muted-foreground">
              Manage your account, credits, and preferences
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4" />
                Credits
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </TabsTrigger>
            </TabsList>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member since</span>
                    <span className="font-medium">January 2024</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <Button variant="outline" onClick={signOut} className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{userStats.totalModelsRun}</div>
                      <p className="text-sm text-muted-foreground">Models Run</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{userStats.creditsUsed}</div>
                      <p className="text-sm text-muted-foreground">Credits Used</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Credits Tab */}
            <TabsContent value="credits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5" />
                    Credit Balance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{creditBalance}</div>
                    <p className="text-sm text-muted-foreground">Available Credits</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credits used this month</span>
                      <span>{userStats.creditsUsed}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Credits purchased</span>
                      <span>{userStats.creditsPurchased}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {creditHistory.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            transaction.type === 'purchase' || transaction.type === 'refund' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'purchase' || transaction.type === 'refund' ? '+' : '-'}{transaction.amount} credits
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    General Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <Select 
                      value={userSettings?.theme || 'system'} 
                      onValueChange={(value) => updateSettings({ theme: value as 'light' | 'dark' | 'system' })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                    </div>
                    <Switch 
                      checked={userSettings?.email_notifications || false}
                      onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Credit Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when credits are running low</p>
                    </div>
                    <Switch 
                      checked={userSettings?.credit_alerts || false}
                      onCheckedChange={(checked) => updateSettings({ credit_alerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>API Access</Label>
                      <p className="text-sm text-muted-foreground">Enable API access for developers</p>
                    </div>
                    <Switch 
                      checked={userSettings?.api_access || false}
                      onCheckedChange={(checked) => updateSettings({ api_access: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Buy Credits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {creditPackages.map((pkg) => (
                      <div 
                        key={pkg.id}
                        className={`p-6 rounded-xl border flex flex-col h-full ${
                          pkg.popular 
                            ? "border-primary/50 cosmic-glow bg-card" 
                            : "border-border cosmic-gradient bg-card"
                        } transition-all duration-300 relative`}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm rounded-full font-medium">
                            Most Popular
                          </div>
                        )}
                        
                        <div className="mb-auto">
                          <h3 className="text-xl font-medium tracking-tighter mb-1">{pkg.name}</h3>
                          
                          <div className="mb-4">
                            <div className="text-2xl font-bold">${(pkg.price / 100).toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">${(pkg.pricePerCredit / 100).toFixed(2)} per credit</div>
                          </div>
                          
                          <p className="text-muted-foreground mb-4">{pkg.description}</p>
                          
                          <div className="space-y-2 mb-6">
                            {pkg.features.map((feature, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <div className="h-3 w-3 rounded-full bg-primary/20 flex items-center justify-center">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                                </div>
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handlePurchaseCredits(pkg.id)}
                          className="w-full"
                        >
                          Buy {pkg.credits} Credits
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 