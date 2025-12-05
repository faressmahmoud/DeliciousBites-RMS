import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderTotal, paymentMethod, orderId, confirmationPin: initialConfirmationPin, serviceMode } = location.state || {};
  const [copied, setCopied] = useState(false);
  // Initialize PIN immediately - use passed PIN or generate fallback for delivery orders
  const [confirmationPin, setConfirmationPin] = useState(() => {
    if (initialConfirmationPin) {
      return initialConfirmationPin;
    }
    // Immediate fallback: use order ID as PIN for delivery orders (no "Loading..." state)
    if ((serviceMode === 'delivery' || serviceMode === 'Delivery') && orderId) {
      return String(orderId).padStart(4, '0').slice(-4);
    }
    return null;
  });

  // Fetch real confirmation PIN from backend in background (updates if found)
  useEffect(() => {
    if ((serviceMode === 'delivery' || serviceMode === 'Delivery') && orderId && !initialConfirmationPin) {
      const fetchOrderDetails = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
          if (response.ok) {
            const order = await response.json();
            const pin = order.confirmationPin || order.confirmation_pin;
            if (pin) {
              setConfirmationPin(pin); // Update with real PIN if found
            }
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
        }
      };
      fetchOrderDetails();
    }
  }, [serviceMode, orderId, initialConfirmationPin]);

  const handleCopyPin = () => {
    if (confirmationPin) {
      navigator.clipboard.writeText(confirmationPin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
              {orderId && (
                <p className="text-stone-700 mt-1">
                  <span className="font-semibold">Order #:</span> {orderId}
                </p>
              )}
              {(serviceMode === 'delivery' || serviceMode === 'Delivery') && confirmationPin && (
                <p className="text-stone-700 mt-1">
                  <span className="font-semibold">Confirmation Code:</span> {confirmationPin}
                  <button
                    onClick={handleCopyPin}
                    className="ml-2 px-2 py-1 bg-stone-700 text-amber-50 rounded text-xs hover:bg-stone-600 transition-colors"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </p>
              )}
            </div>
          )}

          {serviceMode === 'delivery' && confirmationPin && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 text-sm text-center">
                Please provide this confirmation code to the delivery driver upon arrival.
              </p>
            </div>
          )}
          <button
            onClick={() => navigate('/menu')}
            className="bg-stone-800 text-amber-50 px-8 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

