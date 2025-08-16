import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CreditCard, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // You can verify the payment here if needed
      toast.success('Payment successful! Credits have been added to your account.');
      setIsLoading(false);
    }
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Your credits have been added to your account successfully.
            </p>
            <div className="flex items-center justify-center gap-2 text-primary">
              <CreditCard className="h-5 w-5" />
              <span className="font-medium">Credits Added</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/models">
                <ArrowRight className="h-4 w-4 mr-2" />
                Start Using Models
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/settings">
                View Account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess; 