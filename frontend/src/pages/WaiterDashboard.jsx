import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useRoleAuth } from '../context/RoleAuthContext';
import { API_BASE_URL, API_URL } from '../config/api';

export default function WaiterDashboard() {
  const navigate = useNavigate();
  const { staffUser, logout } = useRoleAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ready'); // 'ready', 'served', 'all'
  const [markingServed, setMarkingServed] = useState({});

  useEffect(() => {
    const socket = io(API_URL);
    
    // Listen for new ready orders
    socket.on('orderReadyForWaiter', (order) => {
      if (filter === 'ready' || filter === 'all') {
        setOrders(prev => {
          // Check if order already exists
          const exists = prev.find(o => o.orderId === order.orderId);
          if (exists) return prev;
          return [order, ...prev];
        });
      }
    });
    
    // Listen for order served events
    socket.on('orderServed', ({ orderId }) => {
      if (filter === 'ready') {
        // Remove from ready list
        setOrders(prev => prev.filter(o => o.orderId !== orderId));
      } else if (filter === 'served' || filter === 'all') {
        // Reload to get updated served status
        loadOrders();
      }
    });
    
    loadOrders();
    
    return () => socket.disconnect();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/waiter/orders?filter=${filter}`);
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkServed = async (orderId) => {
    try {
      setMarkingServed(prev => ({ ...prev, [orderId]: true }));
      const response = await fetch(`${API_BASE_URL}/waiter/orders/${orderId}/mark-served`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark order as served');
      }

      // If viewing ready orders, remove from list
      if (filter === 'ready') {
        setOrders(prev => prev.filter(o => o.orderId !== orderId));
      } else {
        // Reload to refresh the list
        loadOrders();
      }
    } catch (err) {
      console.error('Error marking order as served:', err);
      alert(err.message || 'Failed to mark order as served');
    } finally {
      setMarkingServed(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/staff-role-login');
  };

  const getFilterLabel = (filterValue) => {
    switch (filterValue) {
      case 'ready':
        return 'Orders to Serve';
      case 'served':
        return 'Served Orders';
      case 'all':
        return 'All Orders';
      default:
        return filterValue;
    }
  };

  const getEmptyMessage = () => {
    switch (filter) {
      case 'ready':
        return 'No orders ready to serve at this time.';
      case 'served':
        return 'No served orders found.';
      case 'all':
        return 'No orders found.';
      default:
        return 'No orders found.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
      <div className="bg-stone-800 text-amber-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Waiter Dashboard</h1>
              <p className="text-stone-400 text-sm mt-1">
                Welcome, {staffUser?.name || 'Waiter'}
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
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-stone-200">
            <button
              onClick={() => setFilter('ready')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                filter === 'ready'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-stone-600 hover:text-stone-800'
              }`}
            >
              Orders to Serve
              {filter === 'ready' && orders.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('served')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                filter === 'served'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-stone-600 hover:text-stone-800'
              }`}
            >
              Served Orders
              {filter === 'served' && orders.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {orders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 font-medium transition-colors border-b-2 ${
                filter === 'all'
                  ? 'border-stone-600 text-stone-800'
                  : 'border-transparent text-stone-600 hover:text-stone-800'
              }`}
            >
              All Orders
              {filter === 'all' && orders.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-stone-100 text-stone-800 rounded-full text-xs font-semibold">
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Orders Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-stone-800">{getFilterLabel(filter)}</h2>
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-stone-700 text-amber-50 rounded-lg hover:bg-stone-600 transition-colors text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 text-center">
              <p className="text-stone-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 text-center">
              <p className="text-stone-600 text-lg">{getEmptyMessage()}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map((order) => (
                <div
                  key={order.orderId}
                  className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-lg transition-shadow ${
                    order.served
                      ? 'border-blue-300'
                      : filter === 'ready'
                      ? 'border-green-300'
                      : 'border-stone-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-stone-800">{order.tableNumber}</h3>
                      <p className="text-sm text-stone-600">Order #{order.orderId}</p>
                      {order.served && order.servedAt && (
                        <p className="text-xs text-stone-500 mt-1">
                          Served: {new Date(order.servedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        order.served
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {order.served ? 'Served' : order.status === 'completed' ? 'Ready' : order.status}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-stone-700 mb-2">Items:</h4>
                    <ul className="space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-sm text-stone-600">
                          {item.quantity}x {item.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {!order.served && order.status === 'completed' && (
                    <button
                      onClick={() => handleMarkServed(order.orderId)}
                      disabled={markingServed[order.orderId]}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {markingServed[order.orderId] ? 'Marking as Served...' : 'Mark as Served'}
                    </button>
                  )}

                  {order.served && (
                    <div className="w-full px-4 py-3 bg-blue-50 text-blue-800 rounded-lg text-center font-medium border border-blue-200">
                      ✓ Served
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table Status Section (keeping existing UI) */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Table Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* This section can be enhanced later with real table data */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-stone-200 text-center">
              <p className="text-stone-600 text-sm">Table status view coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
