import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders } from '../services/api';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchUserOrders(user.id);
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: 'Received',
      preparing: 'Preparing',
      'out-for-delivery': 'Out for Delivery',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusLabels[status] || status;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-blue-100 text-blue-800',
      preparing: 'bg-yellow-100 text-yellow-800',
      'out-for-delivery': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-stone-100 text-stone-800';
  };

  if (!user) {
    return (
      <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-12 min-h-full">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-stone-600">Please log in to view your orders.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-12 min-h-full">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-stone-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-amber-50 to-stone-50 px-4 py-8 md:py-12 min-h-full">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-8">My Orders</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
            <p className="text-stone-600 text-lg">You don't have any orders yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-stone-800">
                          Order #{order.id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600">
                        {formatDate(order.created_at)}
                      </p>
                      <p className="text-sm text-stone-600 capitalize mt-1">
                        {order.service_mode.replace('-', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-stone-800">
                        EGP {parseFloat(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {items && items.length > 0 && (
                    <div className="border-t border-stone-200 pt-4">
                      <p className="text-sm font-medium text-stone-700 mb-2">Items:</p>
                      <ul className="space-y-1">
                        {items.map((item, idx) => (
                          <li key={idx} className="text-sm text-stone-600">
                            {item.quantity}x Item #{item.id} - EGP {parseFloat(item.price).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
