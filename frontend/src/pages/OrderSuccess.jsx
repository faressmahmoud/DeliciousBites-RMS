import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderTotal, paymentMethod } = location.state || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/menu');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4 py-12 min-h-full">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-stone-800 mb-4">Order Placed!</h1>
          <p className="text-stone-600 mb-4">
            Thank you for your order. We'll prepare it right away.
          </p>
          {orderTotal && (
            <div className="bg-amber-50 rounded-lg p-4 mb-4">
              <p className="text-stone-700">
                <span className="font-semibold">Total:</span> EGP {orderTotal.toFixed(2)}
              </p>
              {paymentMethod && (
                <p className="text-stone-700 mt-1">
                  <span className="font-semibold">Payment:</span> {paymentMethod}
                </p>
              )}
            </div>
          )}
          <p className="text-stone-500 text-sm mb-6">
            Redirecting to menu in a few seconds...
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="bg-stone-800 text-amber-50 px-8 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

