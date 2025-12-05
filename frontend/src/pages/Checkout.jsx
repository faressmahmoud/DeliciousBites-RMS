import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useServiceMode } from '../context/ServiceModeContext';
import { cleanMenuItemName } from '../utils/nameCleaner';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, subtotalEGP, vatEGP, totalEGP } = useCart();
  const { serviceMode, reservation, setDeliveryAddress } = useServiceMode();
  const [deliveryAddress, setLocalDeliveryAddress] = useState({
    street: '',
    building: '',
    area: '',
    city: 'Cairo',
    additionalDirections: '',
  });
  const [addressErrors, setAddressErrors] = useState({});

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const validateDeliveryAddress = () => {
    const errors = {};
    if (!deliveryAddress.street.trim()) {
      errors.street = 'Street address is required';
    }
    if (!deliveryAddress.area.trim()) {
      errors.area = 'Area/District is required';
    }
    if (!deliveryAddress.city.trim()) {
      errors.city = 'City is required';
    }
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressChange = (field, value) => {
    setLocalDeliveryAddress(prev => ({ ...prev, [field]: value }));
    if (addressErrors[field]) {
      setAddressErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProceedToPayment = () => {
    if (serviceMode === 'delivery') {
      if (!validateDeliveryAddress()) {
        return;
      }
      // Format address as single string
      const formattedAddress = [
        deliveryAddress.street,
        deliveryAddress.building && `Building ${deliveryAddress.building}`,
        deliveryAddress.area,
        deliveryAddress.city,
        deliveryAddress.additionalDirections && `(${deliveryAddress.additionalDirections})`
      ].filter(Boolean).join(', ');
      
      setDeliveryAddress(formattedAddress);
    }
    navigate('/payment');
  };

  return (
    <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-12 min-h-full">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-stone-800 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {serviceMode === 'dine-in' && reservation && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h2 className="text-xl font-semibold text-stone-800 mb-4">Reservation Details</h2>
                <div className="space-y-2 text-stone-700">
                  <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-medium">{reservation.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Party Size:</span>
                    <span className="font-medium">{reservation.partySize} {reservation.partySize === '1' ? 'person' : 'people'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">{formatDate(reservation.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span className="font-medium">{formatTime(reservation.time)}</span>
                  </div>
                </div>
              </div>
            )}

            {serviceMode === 'delivery' && (
              <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                <h2 className="text-xl font-semibold text-stone-800 mb-4">Delivery Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="e.g., 123 Main Street"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent ${
                        addressErrors.street ? 'border-red-300' : 'border-stone-300'
                      }`}
                    />
                    {addressErrors.street && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.street}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Building / Apartment / Floor
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.building}
                      onChange={(e) => handleAddressChange('building', e.target.value)}
                      placeholder="e.g., Building 5, Apartment 12, Floor 3"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Area / District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.area}
                      onChange={(e) => handleAddressChange('area', e.target.value)}
                      placeholder="e.g., Zamalek, Maadi, Heliopolis"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent ${
                        addressErrors.area ? 'border-red-300' : 'border-stone-300'
                      }`}
                    />
                    {addressErrors.area && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.area}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="Cairo"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent ${
                        addressErrors.city ? 'border-red-300' : 'border-stone-300'
                      }`}
                    />
                    {addressErrors.city && (
                      <p className="mt-1 text-sm text-red-600">{addressErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Additional Directions
                    </label>
                    <textarea
                      value={deliveryAddress.additionalDirections}
                      onChange={(e) => handleAddressChange('additionalDirections', e.target.value)}
                      placeholder="e.g., Near the mosque, Ring doorbell twice"
                      rows={3}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
              <h2 className="text-xl font-semibold text-stone-800 mb-4">Order Items</h2>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-stone-100 last:border-b-0">
                    <img
                      src={item.image}
                      alt={cleanMenuItemName(item.name)}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-stone-800">
                        {cleanMenuItemName(item.name)}
                      </h3>
                      <p className="text-sm text-stone-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-stone-800 font-medium">
                      EGP {(item.priceEGP * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-stone-800 mb-6">Order Summary</h2>
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

              <div className="mb-6">
                <div className="px-4 py-2 bg-amber-50 rounded-lg text-stone-800 capitalize text-center">
                  {serviceMode === 'dine-in' ? 'Dine-In' : serviceMode === 'delivery' ? 'Delivery' : 'Pick-Up'}
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full bg-stone-800 text-amber-50 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors mb-3"
              >
                Proceed to Payment
              </button>

              <button
                onClick={() => navigate('/cart')}
                className="w-full bg-white border border-stone-300 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors"
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

