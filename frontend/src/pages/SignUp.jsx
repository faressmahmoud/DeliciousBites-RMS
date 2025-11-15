import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupUser } from '../services/api';

export default function SignUp() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
      const result = await signupUser(phone.trim(), name.trim() || null);
      
      if (result.success && result.verificationRequired) {
        navigate('/verify-otp', { state: { phone: phone.trim() } });
      } else {
        setError('Signup failed. Please try again.');
      }
    } catch (err) {
      if (err.message.includes('already registered')) {
        setError('This phone number is already registered, please log in.');
        setTimeout(() => {
          navigate('/login', { state: { phone: phone.trim() } });
        }, 2000);
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-stone-800 mb-2">Create Account</h1>
            <p className="text-stone-600">Sign up to start ordering</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01X XXXX XXXX"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
                required
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
                Name (Optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-800 text-amber-50 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-stone-600">
              Already have an account?{' '}
              <Link to="/login" className="text-stone-800 font-medium hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

