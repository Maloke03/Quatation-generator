import { useState } from 'react';
import { Share2, Check, Phone } from 'lucide-react';

export default function ShareButton({ 
  onShare, 
  phoneNumber = null,
  variant = 'primary',
  size = 'sm',
  label = 'Share',
  showPhoneInput = false
}) {
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [customPhone, setCustomPhone] = useState(phoneNumber || '');
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    if (showPhoneInput && !phoneNumber) {
      setShowPhoneDialog(true);
    } else {
      doShare(phoneNumber);
    }
  };

  const doShare = (number) => {
    onShare(number);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
    setShowPhoneDialog(false);
  };

  const variantClasses = {
    primary: 'bg-green-700 hover:bg-green-600 text-white',
    secondary: 'bg-[#1e3a2a] hover:bg-[#2a4a35] text-white border border-green-700',
    outline: 'bg-transparent hover:bg-[#1e3a2a] text-gray-400 border border-gray-600 hover:text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <>
      <button
        onClick={handleShare}
        className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-lg font-medium flex items-center gap-2 transition-all duration-200`}
      >
        {shared ? <Check size={size === 'sm' ? 14 : 18} /> : <Share2 size={size === 'sm' ? 14 : 18} />}
        {shared ? 'Sent!' : label}
      </button>

      {/* Phone Number Dialog */}
      {showPhoneDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1810] border border-[#1e3a2a] rounded-xl max-w-sm w-full p-4">
            <h3 className="font-bold text-white mb-3">Enter Client Phone Number</h3>
            <div className="flex items-center gap-2 mb-4">
              <Phone size={18} className="text-green-400" />
              <input
                type="tel"
                placeholder="e.g., 26650000000 (no +)"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="flex-1 bg-[#1e3a2a] text-white p-2 rounded-lg border border-[#2d5a3d] focus:outline-none focus:border-green-500"
              />
            </div>
            <p className="text-xs text-gray-500 mb-3">Enter phone number without + or spaces (e.g., 26650000000)</p>
            <div className="flex gap-2">
              <button
                onClick={() => doShare(customPhone)}
                disabled={!customPhone}
                className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg"
              >
                Share
              </button>
              <button
                onClick={() => setShowPhoneDialog(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}