import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { verifyOTP } from '../services/api';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const phone = location.state?.phone || '';

  if (!phone) {
    navigate('/signup');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp.trim() || otp.trim().length < 4) {
      setError('Please enter a valid OTP');
      setLoading(false);
      return;
    }

    try {
      const result = await verifyOTP(phone, otp.trim());
      
      if (result.success && result.user) {
        setUser(result.user);
        navigate('/service-mode');
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 6);
    setOtp(value);
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-stone-800 mb-2">Verify Your Phone Number</h1>
            <p className="text-stone-600">Enter the 6-digit code sent to your phone.</p>
            <p className="text-sm text-stone-500 mt-2">{phone}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-stone-700 mb-2">
                OTP Code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="123456"
                maxLength="6"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800 text-center text-2xl tracking-widest font-mono"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full bg-stone-800 text-amber-50 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="text-sm text-stone-600 hover:text-stone-800"
            >
              ← Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

