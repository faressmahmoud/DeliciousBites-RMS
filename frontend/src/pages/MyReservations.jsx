import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserReservations } from '../services/api';

export default function MyReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadReservations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await fetchUserReservations(user.id);
      setReservations(data);
    } catch (err) {
      setError('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusBadge = (status) => {
    const statusColors = {
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-stone-100 text-stone-800',
    };
    return statusColors[status] || 'bg-stone-100 text-stone-800';
  };

  if (!user) {
    return (
      <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-12 min-h-full">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-stone-600">Please log in to view your reservations.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-12 min-h-full">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-stone-600">Loading reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-8 md:py-12 min-h-full">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-8">My Reservations</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {reservations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <p className="text-stone-600 text-lg">You don't have any reservations yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-stone-800">{reservation.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(
                          reservation.status
                        )}`}
                      >
                        {reservation.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-stone-600 text-sm">
                      <p>
                        <span className="font-medium">Date:</span> {formatDate(reservation.date)}
                      </p>
                      <p>
                        <span className="font-medium">Time:</span> {formatTime(reservation.time)}
                      </p>
                      <p>
                        <span className="font-medium">Party Size:</span> {reservation.party_size}{' '}
                        {reservation.party_size === 1 ? 'person' : 'people'}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span> {reservation.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

