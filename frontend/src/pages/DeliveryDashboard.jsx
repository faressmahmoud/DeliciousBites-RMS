import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useRoleAuth } from '../context/RoleAuthContext';
import { API_BASE_URL, API_URL } from '../config/api';

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { staffUser, logout } = useRoleAuth();
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const socket = io(API_URL);
    
    // Listen for new delivery orders ready for pickup
    socket.on('deliveryOrderReady', (order) => {
      console.log('Delivery order ready:', order);
      // Add to notifications
      setNotifications(prev => {
        const exists = prev.find(n => n.id === order.id);
        if (exists) return prev;
        return [order, ...prev];
      });
      // Add to orders list if not already there
      setOrders(prev => {
        const exists = prev.find(o => o.id === order.id);
        if (exists) return prev;
        return [order, ...prev];
      });
    });

    // Listen for order status changes
    socket.on('orderStatusChanged', ({ orderId, status }) => {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
    });

    loadOrders();
    loadNotifications();

    return () => socket.disconnect();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/delivery/orders`);
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/staff-role-login');
  };

  const unreadCount = notifications.filter(n => !n.acknowledged).length;

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      preparing: 'Preparing',
      completed: 'Ready for Pickup',
      verified: 'Verified',
      'out-for-delivery': 'Out for Delivery',
      delivered: 'Delivered',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      preparing: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      verified: 'bg-purple-100 text-purple-800',
      'out-for-delivery': 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Filter orders for delivery - include all delivery orders regardless of status
  // The backend already filters by status, but we'll show all returned orders
  const deliveryOrders = orders;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center">
        <p className="text-2xl text-stone-600">Loading orders...</p>
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
              <h1 className="text-2xl font-bold">Delivery Dashboard</h1>
              <p className="text-stone-400 text-sm mt-1">
                Welcome, {staffUser?.name || 'Delivery Staff'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications Button */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative bg-stone-700 text-amber-50 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-sm font-medium"
              >
                🔔 Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="bg-stone-700 text-amber-50 px-4 py-2 rounded-lg hover:bg-stone-600 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-stone-800">Notifications</h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-stone-600 hover:text-stone-800"
              >
                ✕
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-stone-600">No notifications</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.acknowledged
                        ? 'bg-stone-50 border-stone-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-stone-800">
                          Order #{notification.id} Ready for Pickup
                        </h3>
                        <p className="text-sm text-stone-600 mt-1">
                          Customer: {notification.customerName || 'N/A'}
                        </p>
                        <p className="text-sm text-stone-600">
                          Address: {notification.deliveryAddress || 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/delivery/orders/${notification.id}`)}
                        className="ml-4 px-4 py-2 bg-stone-800 text-amber-50 rounded-lg hover:bg-stone-700 transition-colors text-sm"
                      >
                        View Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Delivery Orders ({deliveryOrders.length})</h2>
          {deliveryOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-gray-600 text-lg">No delivery orders available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deliveryOrders.map((order) => {
                // Ensure items is an array
                const orderItems = Array.isArray(order.items) ? order.items : [];
                return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/delivery/orders/${order.id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Order #{order.id}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatTime(order.created_at)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Customer:</span>{' '}
                      {order.customerName || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Address:</span>{' '}
                      {order.deliveryAddress || order.delivery_address || 'N/A'}
                    </p>
                    <p>
                      <span className="font-medium">Items:</span> {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
                    </p>
                    <p>
                      <span className="font-medium">Total:</span> EGP {order.total?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/delivery/orders/${order.id}`);
                      }}
                      className="w-full px-4 py-2 bg-stone-800 text-amber-50 rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

