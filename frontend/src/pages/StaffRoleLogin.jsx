import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleAuth } from '../context/RoleAuthContext';

export default function StaffRoleLogin() {
  const navigate = useNavigate();
  const { login } = useRoleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    const result = await login(email.trim(), password.trim());

    if (result.success) {
      navigate(result.route);
    } else {
      setError(result.error || 'Invalid credentials.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-stone-800 mb-2">Staff Login</h1>
            <p className="text-stone-600">Enter your email to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
                required
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
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-stone-700 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-stone-600">
              <div className="flex justify-between">
                <span className="font-medium">Manager:</span>
                <span className="font-mono">manager@example.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Kitchen:</span>
                <span className="font-mono">kitchen@example.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Waiter:</span>
                <span className="font-mono">waiter@example.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Reception:</span>
                <span className="font-mono">reception@example.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Delivery:</span>
                <span className="font-mono">delivery@example.com</span>
              </div>
              <p className="text-xs text-stone-500 mt-2 pt-2 border-t border-amber-200">
                Password: <span className="font-mono">password123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

