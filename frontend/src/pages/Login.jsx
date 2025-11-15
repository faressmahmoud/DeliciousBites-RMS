import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestLoginOTP, verifyLoginOTP } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('request');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.phone) {
      setPhone(location.state.phone);
    }
  }, [location.state]);

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    if (phone.trim().length < 10) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    try {
      const result = await requestLoginOTP(phone.trim());
      
      if (result.success && result.otpRequired) {
        setStep('verify');
      }
    } catch (err) {
      if (err.message.includes('not found')) {
        setError('Phone not found. Please sign up first.');
      } else {
        setError(err.message || 'Failed to request OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!otp.trim() || otp.trim().length < 4) {
      setError('Please enter a valid OTP');
      setLoading(false);
      return;
    }

    try {
      const result = await verifyLoginOTP(phone.trim(), otp.trim());
      
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
            <h1 className="text-3xl font-bold text-stone-800 mb-2">Welcome Back</h1>
            <p className="text-stone-600">
              {step === 'request' ? 'Login to your account' : 'Enter the OTP sent to your phone'}
            </p>
            {step === 'verify' && (
              <p className="text-sm text-stone-500 mt-2">{phone}</p>
            )}
          </div>

          {step === 'request' ? (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="01X XXXX XXXX"
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                  {error.includes('not found') && (
                    <div className="mt-2">
                      <Link to="/signup" className="text-stone-800 font-medium underline">
                        Sign up here
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-800 text-amber-50 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
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
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('request');
                  setOtp('');
                  setError('');
                }}
                className="w-full text-stone-600 hover:text-stone-800 text-sm"
              >
                ← Change phone number
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-stone-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-stone-800 font-medium hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
