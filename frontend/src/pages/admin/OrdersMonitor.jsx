import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL, API_URL } from '../../config/api';

export default function OrdersMonitor() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    incomplete: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    timeRange: 'today',
    status: ''
  });

  // Get current user role
  const staffUser = JSON.parse(localStorage.getItem('staffUser') || '{}');
  const isManager = staffUser.role === 'manager';

  useEffect(() => {
    const socket = io(API_URL);
    
    socket.on('newOrder', (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      loadSummary();
    });

    socket.on('orderStatusChanged', ({ orderId, status }) => {
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      loadSummary();
    });

    socket.on('summaryUpdate', () => {
      loadSummary();
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    loadOrders();
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.timeRange) params.append('timeRange', filters.timeRange);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`${API_BASE_URL}/admin/orders?${params}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.timeRange) params.append('timeRange', filters.timeRange);
      const response = await fetch(`${API_BASE_URL}/admin/orders/summary?${params}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      preparing: 'bg-yellow-100 text-yellow-800',
      'out-for-delivery': 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-stone-100 text-stone-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-stone-800 mb-8">Orders Monitor</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <p className="text-sm text-stone-600 mb-2">Total Orders Today</p>
          <p className="text-3xl font-bold text-stone-800">{summary.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <p className="text-sm text-stone-600 mb-2">Completed Orders</p>
          <p className="text-3xl font-bold text-green-600">{summary.completed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <p className="text-sm text-stone-600 mb-2">Incomplete Orders</p>
          <p className="text-3xl font-bold text-amber-600">{summary.incomplete}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Order Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="dine-in">Dine-In</option>
              <option value="delivery">Delivery</option>
              <option value="pick-up">Pick-Up</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-stone-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
          <p className="text-stone-600 text-lg">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-stone-200 p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-stone-800">Order #{order.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-xs font-medium capitalize">
                        {order.service_mode.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600">{formatDate(order.created_at)}</p>
                    <p className="text-sm text-stone-600 mt-1">
                      {order.items_count || items.length} items • EGP {parseFloat(order.total).toFixed(2)}
                    </p>
                  </div>

                  {/* Action buttons - only show for staff (not managers) */}
                  {!isManager && (
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <>
                          {order.service_mode === 'delivery' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, 'out-for-delivery')}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                              Out for Delivery
                            </button>
                          )}
                          <button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Mark Complete
                          </button>
                        </>
                      )}
                      {order.status === 'out-for-delivery' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
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
  );
}
