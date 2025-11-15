import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white border-b border-stone-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link to="/menu" className="flex items-center gap-2">
          <span className="text-2xl">🍴</span>
          <h1 className="text-2xl font-bold text-stone-800">Delicious Bites</h1>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to="/cart"
            className="relative p-2 text-stone-600 hover:text-stone-800 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone-600">{user.phone}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-stone-600 hover:text-stone-800 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

