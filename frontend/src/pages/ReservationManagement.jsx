import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useRoleAuth } from '../context/RoleAuthContext';
import { API_BASE_URL, API_URL } from '../config/api';

export default function ReservationManagement() {
  const navigate = useNavigate();
  const { staffUser, logout } = useRoleAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');

  useEffect(() => {
    const socket = io(API_URL);
    
    // Listen for reservation WebSocket events
    socket.on('reservation_created', (reservation) => {
      console.log('Reservation created:', reservation);
      setReservations(prev => {
        // Check if reservation already exists
        const exists = prev.find(r => r.id === reservation.id);
        if (exists) return prev;
        // Add new reservation and re-sort
        const updated = [...prev, reservation];
        return sortReservations(updated);
      });
    });

    socket.on('reservation_updated', (reservation) => {
      console.log('Reservation updated:', reservation);
      setReservations(prev => {
        const updated = prev.map(r => 
          r.id === reservation.id ? reservation : r
        );
        // If reservation doesn't exist yet, add it
        const exists = updated.find(r => r.id === reservation.id);
        if (!exists) {
          updated.push(reservation);
        }
        return sortReservations(updated);
      });
    });

    socket.on('reservation_deleted', ({ id }) => {
      console.log('Reservation deleted:', id);
      setReservations(prev => prev.filter(r => r.id !== id));
    });

    // Load initial reservations
    loadReservations();

    return () => socket.disconnect();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try multiple endpoints in order of preference
      let response;
      let data;
      
      // Strategy 1: Try dine-in endpoint (local backend with latest routes)
      try {
        response = await fetch(`${API_BASE_URL}/reservations/dine-in`);
        if (response.ok) {
          data = await response.json();
          setReservations(sortReservations(data));
          return;
        }
      } catch (e) {
        // Continue to next strategy
      }
      
      // Strategy 2: Try general reservations endpoint
      try {
        response = await fetch(`${API_BASE_URL}/reservations`);
        if (response.ok) {
          data = await response.json();
          // Format and filter for future reservations
          const formatted = Array.isArray(data) ? data
            .filter(r => {
              if (!r.date || !r.time) return false;
              const resDate = new Date(`${r.date}T${r.time}`);
              return resDate >= new Date();
            })
            .map(r => ({
              id: r.id,
              customerName: r.name || r.customerName,
              date: r.date,
              time: r.time,
              guestCount: r.party_size || r.guestCount,
              status: r.status || 'confirmed'
            })) : [];
          setReservations(sortReservations(formatted));
          return;
        }
      } catch (e) {
        // Continue to next strategy
      }
      
      // Strategy 3: Try user reservations endpoint (if we have a user context)
      // This is a last resort - won't work for receptionist view but handles edge cases
      
      // If all strategies fail, show empty list with error
      throw new Error('Unable to connect to reservation service. Please ensure the backend server is running.');
    } catch (err) {
      console.error('Error loading reservations:', err);
      setError(err.message || 'Failed to load reservations');
      setReservations([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const sortReservations = (reservationsList) => {
    // Sort by closest upcoming time (date first, then time)
    return [...reservationsList].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });
  };

  // Filter reservations based on active filters
  const filteredReservations = reservations.filter(reservation => {
    // Name filter (case-insensitive, partial match)
    if (nameFilter && !reservation.customerName.toLowerCase().includes(nameFilter.toLowerCase())) {
      return false;
    }
    
    // Date filter (exact match)
    if (dateFilter && reservation.date !== dateFilter) {
      return false;
    }
    
    // Time filter (partial match - e.g., "18" matches "18:30")
    if (timeFilter && !reservation.time.includes(timeFilter)) {
      return false;
    }
    
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/staff-role-login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    // Convert 24h to 12h format if needed
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center">
        <p className="text-2xl text-stone-600">Loading reservations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
      {/* Header */}
      <div className="bg-stone-800 text-amber-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Reservation Management</h1>
              <p className="text-stone-400 text-sm mt-1">
                Welcome, {staffUser?.name || 'Receptionist'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-stone-700 text-amber-50 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Search & Filter</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search by name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reservation Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Time Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reservation Time
              </label>
              <input
                type="text"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                placeholder="e.g., 18 or 18:30"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(nameFilter || dateFilter || timeFilter) && (
            <button
              onClick={() => {
                setNameFilter('');
                setDateFilter('');
                setTimeFilter('');
              }}
              className="mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error: {error}</p>
            <button
              onClick={loadReservations}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Reservations List */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Upcoming Reservations ({filteredReservations.length})
            </h2>
            <button
              onClick={loadReservations}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Refresh
            </button>
          </div>

          {filteredReservations.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
              <p className="text-lg text-gray-600">
                {reservations.length === 0
                  ? 'No reservations found'
                  : 'No reservations match your filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {reservation.customerName}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            reservation.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : reservation.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {reservation.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span>{' '}
                          {formatDate(reservation.date)}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span>{' '}
                          {formatTime(reservation.time)}
                        </div>
                        <div>
                          <span className="font-medium">Guests:</span>{' '}
                          {reservation.guestCount}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="text-sm text-gray-500">
                        Reservation #{reservation.id}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

