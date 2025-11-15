import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceMode } from '../context/ServiceModeContext';
import { useAuth } from '../context/AuthContext';
import { createReservation } from '../services/api';

export default function Reservation() {
  const navigate = useNavigate();
  const { setReservation } = useServiceMode();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    partySize: '2',
    date: '',
    time: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.date || !formData.time) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const reservationData = {
        userId: user?.id || null,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        partySize: parseInt(formData.partySize),
        date: formData.date,
        time: formData.time,
      };

      const savedReservation = await createReservation(reservationData);
      setReservation(savedReservation);
      navigate('/reservation-confirmation');
    } catch (err) {
      setError(err.message || 'Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-stone-800 mb-2">Make a Reservation</h1>
            <p className="text-stone-600">Book your table for dine-in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01X XXXX XXXX"
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
                required
              />
            </div>

            <div>
              <label htmlFor="partySize" className="block text-sm font-medium text-stone-700 mb-2">
                Party Size <span className="text-red-500">*</span>
              </label>
              <select
                id="partySize"
                name="partySize"
                value={formData.partySize}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                  <option key={size} value={size.toString()}>
                    {size} {size === 1 ? 'person' : 'people'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-stone-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={today}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
                  required
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-stone-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-800 text-amber-50 py-3 rounded-lg font-medium hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Reservation...' : 'Confirm Reservation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

