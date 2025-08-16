
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { creditPackages, stripeService, initializeStripe } from '@/lib/stripeService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';

const Pricing = () => {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchaseCredits = async (packageId: string) => {
    if (!user) {
      toast.error('Please log in to purchase credits');
      return;
    }
    
    const package_ = creditPackages.find(p => p.id === packageId);
    if (!package_) {
      toast.error('Invalid package selected');
      return;
    }

    setSelectedPackage(package_);
    setIsPaymentModalOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedPackage || !user) return;

    setIsProcessing(true);
    
    try {
      // Create checkout session
      const checkoutSession = await stripeService.createCheckoutSession(selectedPackage.id, user.id);
      if (!checkoutSession) {
        toast.error('Failed to create checkout session');
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = checkoutSession.url;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
      setIsPaymentModalOpen(false);
    }
  };
  
  return (
    <section id="pricing" className="w-full py-20 px-6 md:px-12 bg-background">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-foreground">
            Simple Pricing for Video Generation
          </h2>
          <p className="text-muted-foreground text-lg">
            Pay-per-use credits for creating amazing videos with our AI models
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {creditPackages.map((package_, index) => (
            <div 
              key={index}
              className={`p-6 rounded-xl border flex flex-col h-full ${
                package_.popular 
                  ? "border-primary/50 cosmic-glow bg-card" 
                  : "border-border cosmic-gradient bg-card"
              } transition-all duration-300 relative`}
            >
              {package_.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm rounded-full font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="mb-auto">
                <h3 className="text-2xl font-medium tracking-tighter mb-1 text-foreground">{package_.name}</h3>
                
                <div className="mb-4">
                  <div className="text-3xl font-bold tracking-tighter text-foreground">${(package_.price / 100).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">${(package_.pricePerCredit / 100).toFixed(2)} per credit</div>
                </div>
                
                <p className="text-muted-foreground mb-6">{package_.description}</p>
                
                <div className="space-y-3 mb-8">
                  {package_.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  onClick={() => handlePurchaseCredits(package_.id)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Buy {package_.credits} Credits
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            Need more credits? <a href="#" className="text-primary hover:underline">Contact us for custom packages</a>
          </div>
          <div className="text-sm text-muted-foreground">
            Credits never expire • Use for video generation • No monthly fees
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPackage && (
              <div className="text-center">
                <h3 className="text-lg font-semibold">{selectedPackage.name}</h3>
                <p className="text-2xl font-bold text-primary">
                  ${(selectedPackage.price / 100).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedPackage.credits} credits
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Pricing;
