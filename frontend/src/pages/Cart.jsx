import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { cleanMenuItemName } from '../utils/nameCleaner';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, subtotalEGP, vatEGP, totalEGP } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-12 min-h-full">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-8">Your Cart</h1>
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <div className="text-stone-300 mb-4">
              <svg
                className="w-24 h-24 mx-auto"
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
            </div>
            <p className="text-xl font-semibold text-stone-800 mb-2">Your cart is empty</p>
            <p className="text-stone-600 mb-6">Start adding items to your cart</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-stone-800 text-amber-50 px-8 py-3 rounded-lg hover:bg-stone-700 transition-colors font-medium"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-8 md:py-12 min-h-full">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-8">Your Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-6 border-b border-stone-100 last:border-b-0 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <img
                    src={item.image}
                    alt={cleanMenuItemName(item.name)}
                    className="w-24 h-24 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x200/f5f5dc/8b7355?text=Delicious+Bites';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-stone-800 mb-1">
                      {cleanMenuItemName(item.name)}
                    </h3>
                    <p className="text-sm text-stone-600">EGP {item.priceEGP.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-9 h-9 rounded-lg border border-stone-300 hover:bg-stone-50 flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium text-stone-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-9 h-9 rounded-lg border border-stone-300 hover:bg-stone-50 flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-800">
                        EGP {(item.priceEGP * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 p-2 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 sticky top-8">
              <h2 className="text-xl font-bold text-stone-800 mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-stone-700">
                  <span>Subtotal:</span>
                  <span className="font-medium">EGP {subtotalEGP.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>VAT (14%):</span>
                  <span className="font-medium">EGP {vatEGP.toFixed(2)}</span>
                </div>
                <div className="border-t border-stone-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-stone-800">
                    <span>Total:</span>
                    <span className="text-stone-800">EGP {totalEGP.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-stone-800 text-amber-50 py-3 px-4 rounded-lg hover:bg-stone-700 transition-colors font-medium mb-3"
              >
                Checkout
              </button>
              <button
                onClick={() => navigate('/menu')}
                className="w-full bg-white border border-stone-300 text-stone-700 py-3 px-4 rounded-lg hover:bg-stone-50 transition-colors font-medium"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

