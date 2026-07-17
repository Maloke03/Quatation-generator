import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
// eslint-disable-next-line
import { TopBar, Card, Button } from '../components/UI';
// eslint-disable-next-line
import { Mail, Lock, User, ArrowLeft, KeyRound, CheckCircle, AlertCircle, LogIn } from 'lucide-react';

export default function Login({ navigate }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  // eslint-disable-next-line
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check if user is already signed in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is already signed in, redirect to dashboard
        navigate('dashboard');
      }
      setCheckingSession(false);
    };
    checkSession();
  }, [navigate]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0a1810] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Checking session...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        // After login, check if user exists in our users table
        if (data.user) {
          // eslint-disable-next-line
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          
          // If user doesn't exist in users table, create them
          if (!userData) {
            const trialEnds = new Date();
            trialEnds.setDate(trialEnds.getDate() + 30);
            
            const newUser = {
              id: data.user.id,
              device_id: data.user.id,
              email: email,
              trial_ends: trialEnds.toISOString(),
              is_active: true,
              has_paid: false,
              is_admin: false,
              subscription_status: 'trial'
            };
            
            const { error: insertError } = await supabase
              .from('users')
              .insert(newUser);
            
            if (insertError) throw insertError;
          }
        }
        
        navigate('dashboard');
      } else {
        // Signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        
        if (data.user) {
          const trialEnds = new Date();
          trialEnds.setDate(trialEnds.getDate() + 30);
          
          const newUser = {
            id: data.user.id,
            device_id: data.user.id,
            email: email,
            trial_ends: trialEnds.toISOString(),
            is_active: true,
            has_paid: false,
            is_admin: false,
            subscription_status: 'trial'
          };
          
          const { error: insertError } = await supabase
            .from('users')
            .insert(newUser);
          
          if (insertError) throw insertError;
        }
        
        alert('✅ Account created! Please check your email to confirm.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

const handleResetPassword = async (e) => {
  e.preventDefault();
  
  if (!resetEmail) {
    setResetError('Please enter your email address.');
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(resetEmail)) {
    setResetError('Please enter a valid email address.');
    return;
  }

  setLoading(true);
  setResetError('');
  setResetSuccess(false);
  
  try {
    // Get the app URL - use Vercel URL if available
    const appUrl = process.env.REACT_APP_APP_URL || 'https://quatation-generator-eight.vercel.app/?';
    
    console.log('Sending reset email with redirect to:', `${appUrl}/reset-password`);
    
    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${appUrl}/reset-password`,
    });
    
    if (error) throw error;
    
    // Success
    setResetSuccess(true);
    setResetSent(true);
    
    // Clear form after 4 seconds
    setTimeout(() => {
      setIsResetPassword(false);
      setResetSent(false);
      setResetSuccess(false);
      setResetEmail('');
    }, 4000);
    
  } catch (err) {
    console.error('Reset error:', err);
    setResetError(err.message || 'Failed to send reset email. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // If reset password is active, show reset form
  if (isResetPassword) {
    return (
      <div className="min-h-screen bg-[#0a1810] text-white p-4 flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <Card className="p-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-yellow-900/30 p-4 rounded-full">
                  <KeyRound size={32} className="text-yellow-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">Reset Password</h2>
              <p className="text-gray-400 text-sm mt-1">
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>

            {resetSuccess ? (
              <div className="text-center">
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
                  <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                  <p className="text-green-300 text-sm font-medium">✅ Password Reset Email Sent!</p>
                  <p className="text-gray-400 text-xs mt-1">
                    We've sent a password reset link to <span className="text-white font-medium">{resetEmail}</span>
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Please check your inbox and spam folder.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    setIsResetPassword(false);
                    setResetSent(false);
                    setResetSuccess(false);
                    setResetEmail('');
                    setResetError('');
                  }}
                  className="w-full"
                >
                  <LogIn size={16} className="mr-2" />
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full bg-[#1e3a2a] text-white p-2 pl-10 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(false);
                    setResetEmail('');
                    setResetError('');
                    setResetSuccess(false);
                  }}
                  className="w-full text-gray-500 hover:text-gray-400 text-sm flex items-center justify-center gap-1"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>
              </form>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1810] text-white p-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <span className="text-4xl">🏗️</span>
            </div>
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {isLogin ? 'Sign in to manage your projects' : 'Start your 30-day free trial'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-[#1e3a2a] text-white p-2 pl-10 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength="6"
                  className="w-full bg-[#1e3a2a] text-white p-2 pl-10 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsResetPassword(true)}
                  className="text-xs text-gray-500 hover:text-green-400 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-300 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-400 hover:text-green-300 text-sm transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1e3a2a] text-center">
            <p className="text-xs text-gray-500">
              By continuing, you agree to our Terms of Service
            </p>
            <p className="text-xs text-gray-600 mt-1">30-day free trial · No credit card required</p>
          </div>
        </Card>
      </div>
    </div>
  );
}