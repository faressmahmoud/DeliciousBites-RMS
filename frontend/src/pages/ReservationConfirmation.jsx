import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceMode } from '../context/ServiceModeContext';

export default function ReservationConfirmation() {
  const navigate = useNavigate();
  const { reservation } = useServiceMode();

  useEffect(() => {
    if (!reservation) {
      navigate('/reservation');
      return;
    }

    const timer = setTimeout(() => {
      navigate('/menu');
    }, 5000);

    return () => clearTimeout(timer);
  }, [reservation, navigate]);

  if (!reservation) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 text-center">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-stone-800 mb-4">Reservation Confirmed!</h1>
          <p className="text-stone-600 mb-8">
            Your table has been reserved. We'll see you soon!
          </p>

          <div className="bg-amber-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold text-stone-800 mb-4">Reservation Details</h2>
            <div className="space-y-3 text-stone-700">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{reservation.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Phone:</span>
                <span>{reservation.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Party Size:</span>
                <span>{reservation.partySize} {reservation.partySize === '1' ? 'person' : 'people'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{formatDate(reservation.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Time:</span>
                <span>{formatTime(reservation.time)}</span>
              </div>
            </div>
          </div>

          <p className="text-stone-500 text-sm mb-6">
            Redirecting to menu in a few seconds...
          </p>

          <button
            onClick={() => navigate('/menu')}
            className="bg-stone-800 text-amber-50 px-8 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors"
          >
            Continue to Menu
          </button>
        </div>
      </div>
    </div>
  );
}

