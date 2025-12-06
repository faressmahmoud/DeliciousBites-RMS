import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useServiceMode } from '../context/ServiceModeContext';
import { useAuth } from '../context/AuthContext';
import { createOrder, createReservation } from '../services/api';

export default function Payment() {
  const navigate = useNavigate();
  const { cartItems, subtotalEGP, vatEGP, totalEGP, clearCart } = useCart();
  const { serviceMode, reservation, deliveryAddress, setReservation } = useServiceMode();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cardData, setCardData] = useState({
    cardholderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [instapayPhone, setInstapayPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const validateCardForm = () => {
    const newErrors = {};
    
    if (!cardData.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }
    
    if (!cardData.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardData.cardNumber.replace(/\s/g, '').length < 13 || cardData.cardNumber.replace(/\s/g, '').length > 19) {
      newErrors.cardNumber = 'Card number must be between 13 and 19 digits';
    }
    
    if (!cardData.expiryDate.trim()) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
      newErrors.expiryDate = 'Please use MM/YY format';
    }
    
    if (!cardData.cvv.trim()) {
      newErrors.cvv = 'CVV is required';
    } else if (cardData.cvv.length < 3 || cardData.cvv.length > 4) {
      newErrors.cvv = 'CVV must be 3 or 4 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateInstapay = () => {
    if (!instapayPhone.trim()) {
      setErrors({ instapayPhone: 'InstaPay phone number is required' });
      return false;
    }
    if (instapayPhone.trim().length < 10) {
      setErrors({ instapayPhone: 'Please enter a valid phone number' });
      return false;
    }
    return true;
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardInputChange = (field, value) => {
    if (field === 'cardNumber') {
      setCardData({ ...cardData, [field]: formatCardNumber(value) });
    } else if (field === 'expiryDate') {
      setCardData({ ...cardData, [field]: formatExpiryDate(value) });
    } else if (field === 'cvv') {
      setCardData({ ...cardData, [field]: value.replace(/\D/g, '').substring(0, 4) });
    } else {
      setCardData({ ...cardData, [field]: value });
    }
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handlePayment = async () => {
    setError('');
    setErrors({});

    if (paymentMethod === 'card') {
      if (!validateCardForm()) {
        return;
      }
    } else if (paymentMethod === 'instapay') {
      if (!validateInstapay()) {
        return;
      }
    } else if (paymentMethod === 'cash') {
      // Cash payment - no validation needed
    } else {
      setError('Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const isPaid = paymentMethod !== 'cash';
      
      // For dine-in orders with reservation data, create reservation first (only if not already created)
      let reservationId = reservation?.id || null;
      if (serviceMode === 'dine-in' && reservation && !reservation.id && reservation.name) {
        try {
          const reservationData = {
            userId: user?.id || null,
            name: reservation.name,
            phone: reservation.phone,
            partySize: reservation.partySize,
            date: reservation.date,
            time: reservation.time,
          };
          const createdReservation = await createReservation(reservationData);
          reservationId = createdReservation.id;
          // Update context with created reservation
          setReservation(createdReservation);
        } catch (reservationError) {
          console.error('Failed to create reservation:', reservationError);
          // Continue with order creation even if reservation fails
        }
      }

      const orderData = {
        userId: user?.id || null,
        reservationId: reservationId,
        serviceMode,
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          priceEGP: item.priceEGP,
        })),
        subtotal: subtotalEGP,
        vat: vatEGP,
        total: totalEGP,
        paid: isPaid,
        deliveryAddress: serviceMode === 'delivery' ? (deliveryAddress || null) : null,
      };

      const orderResponse = await createOrder(orderData);

      // Clear cart and redirect
      clearCart();
      console.log('Order response:', orderResponse); // Debug log
      navigate('/order-success', {
        state: {
          orderTotal: totalEGP,
          paymentMethod:
            paymentMethod === 'card'
              ? 'Card'
              : paymentMethod === 'instapay'
              ? 'InstaPay'
              : 'Cash on Delivery',
          orderId: orderResponse.id,
          confirmationPin: orderResponse.confirmationPin || orderResponse.confirmation_pin,
          serviceMode: serviceMode,
        },
      });
    } catch (err) {
      setError('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'card', label: 'Pay by Card', icon: '💳' },
    { id: 'instapay', label: 'InstaPay', icon: '📱' },
  ];

  // Only show Cash on Delivery for delivery orders (not for pickup)
  if (serviceMode === 'delivery') {
    paymentMethods.push({ id: 'cash', label: 'Cash on Delivery', icon: '💵' });
  }

  return (
    <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-12 min-h-full">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">Payment</h1>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Order Summary</h2>
          <div className="space-y-2 text-stone-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">EGP {subtotalEGP.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (14%):</span>
              <span className="font-medium">EGP {vatEGP.toFixed(2)}</span>
            </div>
            <div className="border-t border-stone-200 pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-stone-800">
                <span>Total:</span>
                <span>EGP {totalEGP.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-stone-800 mb-4">Select Payment Method</h2>

          <div className="space-y-3 mb-6">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  setPaymentMethod(method.id);
                  setError('');
                  setErrors({});
                }}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === method.id
                    ? 'border-stone-800 bg-stone-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{method.icon}</span>
                  <span className="font-medium text-stone-800">{method.label}</span>
                  {paymentMethod === method.id && (
                    <span className="ml-auto text-stone-600">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {paymentMethod === 'card' && (
            <div className="border-t border-stone-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-stone-800 mb-4">Card Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Cardholder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardData.cardholderName}
                    onChange={(e) => handleCardInputChange('cardholderName', e.target.value)}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800 ${
                      errors.cardholderName ? 'border-red-300' : 'border-stone-300'
                    }`}
                  />
                  {errors.cardholderName && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Card Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cardData.cardNumber}
                    onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800 ${
                      errors.cardNumber ? 'border-red-300' : 'border-stone-300'
                    }`}
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardData.expiryDate}
                      onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                      placeholder="MM/YY"
                      maxLength="5"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800 ${
                        errors.expiryDate ? 'border-red-300' : 'border-stone-300'
                      }`}
                    />
                    {errors.expiryDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      CVV <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardData.cvv}
                      onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                      placeholder="123"
                      maxLength="4"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800 ${
                        errors.cvv ? 'border-red-300' : 'border-stone-300'
                      }`}
                    />
                    {errors.cvv && (
                      <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'instapay' && (
            <div className="border-t border-stone-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-stone-800 mb-4">InstaPay Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    InstaPay Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={instapayPhone}
                    onChange={(e) => {
                      setInstapayPhone(e.target.value);
                      if (errors.instapayPhone) {
                        setErrors({ ...errors, instapayPhone: '' });
                      }
                    }}
                    placeholder="01X XXXX XXXX"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800 ${
                      errors.instapayPhone ? 'border-red-300' : 'border-stone-300'
                    }`}
                  />
                  {errors.instapayPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.instapayPhone}</p>
                  )}
                </div>

                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-sm text-stone-700">
                    <span className="font-medium">Amount to pay:</span> EGP {totalEGP.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing || !instapayPhone.trim()}
                  className="w-full bg-stone-800 text-amber-50 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Pay via InstaPay'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate('/checkout')}
            disabled={processing}
            className="flex-1 bg-white border border-stone-300 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            Back
          </button>
          {paymentMethod !== 'instapay' && (
            <button
              onClick={handlePayment}
              disabled={processing || !paymentMethod || (paymentMethod === 'card' && Object.keys(errors).length > 0)}
              className="flex-1 bg-stone-800 text-amber-50 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : paymentMethod === 'cash' ? 'Confirm Order' : 'Pay Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
