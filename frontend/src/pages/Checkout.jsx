import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useServiceMode } from '../context/ServiceModeContext';
import { cleanMenuItemName } from '../utils/nameCleaner';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, subtotalEGP, vatEGP, totalEGP } = useCart();
  const { serviceMode, reservation } = useServiceMode();

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
                onClick={() => navigate('/payment')}
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

