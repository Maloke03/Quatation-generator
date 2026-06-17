// eslint-disable-next-line
import { useState, useEffect } from 'react';
// eslint-disable-next-line
import { useUser } from '../context/UserContext';
// eslint-disable-next-line
import { recordPayment, getUserByDeviceId } from '../db';
import { TopBar, Card, Button } from '../components/UI';
// eslint-disable-next-line
import { ChevronLeft, Smartphone, CheckCircle, Clock, AlertCircle, Copy, Check, X, Phone } from 'lucide-react';

export default function Subscribe({ navigate }) {
  const { user, refreshAccess, refreshUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [paymentReference, setPaymentReference] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState(1); // 1: choose method, 2: enter details, 3: confirmation
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Your personal payment details
  const MPESA_NUMBER = '58863757';
  const ECOCASH_NUMBER =  '63980310';
  const ACCOUNT_NAME = 'Thabelo Maloke';
  const AMOUNT = '200.00';

  const handleSubmitPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      alert('Please enter a valid phone number');
      return;
    }

    if (!paymentReference || paymentReference.length < 3) {
      alert('Please enter the payment reference number');
      return;
    }

    setLoading(true);
    try {
      // Record payment as pending
      await recordPayment(
        user.id,
        200, // M200
        paymentMethod === 'mpesa' ? 'M-Pesa' : 'EcoCash',
        paymentReference
      );
      
      setSubmitted(true);
      setStep(3);
      
      // Refresh user data
      await refreshUser();
      await refreshAccess();
      
      // Auto-navigate after 5 seconds
      setTimeout(() => {
        navigate('dashboard');
      }, 5000);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error recording payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPaymentInstructions = () => {
    if (paymentMethod === 'mpesa') {
      return {
        title: '📱 M-Pesa Lesotho',
        icon: '📱',
        number: MPESA_NUMBER,
        name: ACCOUNT_NAME,
        steps: [
          `Dial *200# on your phone`,
          `Select "Send Money"`,
          `Enter recipient number: ${MPESA_NUMBER}`,
          `Enter Amount: M${AMOUNT}`,
          `Enter your PIN and confirm`,
          `Copy the confirmation reference number`
        ],
        reference: `Reference: Send to ${MPESA_NUMBER}`,
        amount: `M${AMOUNT}`
      };
    } else {
      return {
        title: '📱 EcoCash Lesotho',
        icon: '📱',
        number: ECOCASH_NUMBER,
        name: ACCOUNT_NAME,
        steps: [
          `Dial *199# on your phone`,
          `Select "Send Money"`,
          `Enter recipient number: ${ECOCASH_NUMBER}`,
          `Enter Amount: M${AMOUNT}`,
          `Enter your PIN and confirm`,
          `Copy the confirmation reference number`
        ],
        reference: `Reference: Send to ${ECOCASH_NUMBER}`,
        amount: `M${AMOUNT}`
      };
    }
  };

  const instructions = getPaymentInstructions();

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a1810] text-white p-4 flex flex-col items-center justify-center">
        <TopBar title="Payment Submitted" />
        <Card className="text-center p-8 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="bg-green-900/30 p-4 rounded-full">
              <CheckCircle size={48} className="text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Payment Submitted! 🎉</h2>
          <p className="text-gray-400 mb-4">
            Your subscription payment has been recorded. 
            Your account will be activated once the payment is confirmed.
          </p>
          <div className="bg-[#1e3a2a] rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-400">Reference: <span className="text-white font-medium">{paymentReference}</span></p>
            <p className="text-sm text-gray-400">Amount: <span className="text-green-400 font-medium">M200.00</span></p>
            <p className="text-sm text-gray-400">Status: <span className="text-yellow-400 font-medium">Pending Verification</span></p>
          </div>
          <Button onClick={() => navigate('dashboard')} className="w-full">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1810] text-white pb-24">
      <TopBar
        title="Subscribe - M200/month"
        left={
          <button onClick={() => navigate('dashboard')} className="text-gray-400 hover:text-white mr-1">
            <ChevronLeft size={22} />
          </button>
        }
      />

      <div className="p-4 space-y-4">
        <Card>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Subscribe to QuotePro</h2>
            <p className="text-gray-400 mt-1">Get full access to all features</p>
            <div className="mt-3 bg-green-900/30 rounded-lg p-2">
              <p className="text-green-400 font-medium">Pay to: <span className="text-white">{ACCOUNT_NAME}</span></p>
            </div>
          </div>
        </Card>

        {step === 1 && (
          <Card>
            <h3 className="font-semibold text-white mb-3">Choose Payment Method</h3>
            <div className="space-y-3">
              <button
                onClick={() => { setPaymentMethod('mpesa'); setStep(2); }}
                className="w-full bg-[#1e3a2a] border border-green-700 rounded-xl p-4 hover:bg-[#2a4a35] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-900/30 p-3 rounded-full">
                    <Smartphone size={24} className="text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">M-Pesa</div>
                    <div className="text-sm text-gray-400">Send to: {MPESA_NUMBER}</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => { setPaymentMethod('ecocash'); setStep(2); }}
                className="w-full bg-[#1e3a2a] border border-green-700 rounded-xl p-4 hover:bg-[#2a4a35] transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-900/30 p-3 rounded-full">
                    <Smartphone size={24} className="text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">EcoCash</div>
                    <div className="text-sm text-gray-400">Send to: {ECOCASH_NUMBER}</div>
                  </div>
                </div>
              </button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <>
            <Card>
              <h3 className="font-semibold text-white mb-3">{instructions.title}</h3>
              
              {/* Payment Details Card */}
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Phone size={18} className="text-green-400" />
                  <span className="text-green-400 font-medium">Send Money To:</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Number</p>
                    <p className="text-white font-bold text-lg">{instructions.number}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(instructions.number)}
                    className="bg-[#1e3a2a] hover:bg-[#2a4a35] p-2 rounded-lg border border-[#2d5a3d]"
                  >
                    {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400" />}
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="text-white font-medium">{instructions.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Amount</p>
                    <p className="text-green-400 font-bold text-lg">{instructions.amount}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 mb-3">Follow these steps:</p>
              <div className="space-y-2">
                {instructions.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 font-bold">{index + 1}.</span>
                    <span className="text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-white mb-3">Confirm Payment</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Your Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g., 63000000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Payment Reference Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter confirmation reference"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="flex-1 bg-[#1e3a2a] text-white p-3 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={() => copyToClipboard(paymentReference)}
                      className="bg-[#1e3a2a] hover:bg-[#2a4a35] p-3 rounded-lg border border-[#2d5a3d]"
                    >
                      {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
                <Button 
                  onClick={handleSubmitPayment} 
                  disabled={loading || !phoneNumber || !paymentReference}
                  className="w-full"
                >
                  {loading ? 'Processing...' : 'Submit Payment'}
                </Button>
                <button
                  onClick={() => setStep(1)}
                  className="w-full text-gray-500 hover:text-gray-400 text-sm py-2"
                >
                  ← Change payment method
                </button>
              </div>
            </Card>

            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-400 mt-0.5" />
                <p className="text-xs text-yellow-300">
                  Send exactly <span className="font-bold">M200.00</span> to <span className="font-bold">{instructions.number}</span> ({instructions.name}).
                  Your subscription will be activated after payment verification (within 24 hours).
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}