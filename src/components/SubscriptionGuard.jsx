import { useUser } from '../context/UserContext';
import { TopBar, Card, Button } from './UI';
// eslint-disable-next-line 
import { Lock, Calendar, CreditCard, AlertTriangle, Clock } from 'lucide-react';

export default function SubscriptionGuard({ children }) {
  // eslint-disable-next-line 
  const { user, access, loading } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a1810]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Checking access...</p>
        </div>
      </div>
    );
  }

  // Check if user has access
  if (!access.allowed) {
    // Redirect to subscribe page using window.location
    // Check if we're already on the subscribe page to avoid infinite redirect
    if (window.location.pathname !== '/subscribe') {
      window.location.href = '/subscribe';
      return null;
    }
    
    // If we're already on subscribe page, show the subscribe UI
    return (
      <div className="min-h-screen bg-[#0a1810] text-white p-4 flex flex-col items-center justify-center">
        <TopBar title="Access Restricted" />
        
        <div className="max-w-md w-full">
          <Card className="text-center p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-900/30 p-4 rounded-full">
                <Lock size={48} className="text-red-400" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Trial Expired</h2>
            <p className="text-gray-400 mb-6">
              Your 30-day free trial has ended. Subscribe to continue using QuotePro.
            </p>
            
            <div className="bg-[#1e3a2a] rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Subscription</span>
                <span className="text-white font-bold">M200/month</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400">Status</span>
                <span className="text-red-400 font-medium">Expired</span>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => {
                window.location.href = '/subscribe';
              }}
            >
              <CreditCard size={18} className="mr-2" />
              Subscribe Now - M200/month
            </Button>
            
            <p className="text-xs text-gray-500 mt-4">
              After payment, the app will automatically unlock. Please contact support if you need assistance.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Trial mode - show banner but allow access
  if (access.status === 'trial' && access.daysLeft !== undefined) {
    const days = access.daysLeft;
    const isExpiringSoon = days <= 5;
    
    return (
      <div className="min-h-screen bg-[#0a1810]">
        {/* Trial banner */}
        <div className={`p-3 text-center text-sm font-medium ${isExpiringSoon ? 'bg-red-900/50 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {isExpiringSoon ? (
              <AlertTriangle size={16} className="text-red-400" />
            ) : (
              <Clock size={16} className="text-green-400" />
            )}
            <span>
              {isExpiringSoon 
                ? `⚠️ Your free trial ends in ${days} day${days > 1 ? 's' : ''}. Subscribe now to continue!` 
                : `✅ Free trial: ${days} day${days > 1 ? 's' : ''} remaining`
              }
            </span>
            {isExpiringSoon && (
              <Button 
                size="sm" 
                className="ml-2" 
                onClick={() => {
                  window.location.href = '/subscribe';
                }}
              >
                Subscribe
              </Button>
            )}
          </div>
        </div>
        
        {/* Main content */}
        {children}
      </div>
    );
  }

  // Full access (paid subscription)
  return children;
}