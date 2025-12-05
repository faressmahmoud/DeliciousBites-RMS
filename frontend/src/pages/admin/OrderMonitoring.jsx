import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL, API_URL } from '../../config/api';
import {
  mapOrderStatusToTrackingState,
  calculateETA,
  getTrackingStatusBadgeColor,
  formatLastUpdated,
} from '../../utils/trackingUtils';

export default function OrderMonitoring() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const socket = io(API_URL);

    // Listen for new orders
    socket.on('newOrder', (newOrder) => {
      if (newOrder.service_mode === 'delivery') {
        setOrders(prev => {
          const exists = prev.find(o => o.id === newOrder.id);
          if (exists) return prev;
          return [newOrder, ...prev];
        });
      }
    });

    // Listen for order status changes
    socket.on('orderStatusChanged', ({ orderId, status }) => {
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      ));
    });

    loadOrders();

    return () => socket.disconnect();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all delivery orders
      const response = await fetch(`${API_BASE_URL}/admin/orders?type=delivery&timeRange=all`);
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      
      const data = await response.json();
      // Filter to only delivery orders and active ones (not cancelled)
      const deliveryOrders = data.filter(order => 
        order.service_mode === 'delivery' && order.status !== 'cancelled'
      );
      
      setOrders(deliveryOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    if (statusFilter === 'all') return orders;
    
    // Map filter to order statuses
    const statusMap = {
      'placed': ['pending', 'preparing'],
      'prepared': ['completed', 'ready-to-serve', 'ready', 'verified'],
      'on-the-way': ['out-for-delivery', 'out_for_delivery'],
      'delivered': ['delivered'],
    };
    
    const targetStatuses = statusMap[statusFilter] || [];
    return orders.filter(order => targetStatuses.includes(order.status));
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-stone-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-stone-800">Order Monitoring</h1>
        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-stone-700 text-amber-50 rounded-lg hover:bg-stone-600 transition-colors text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-stone-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent text-stone-800"
          >
            <option value="all">All Orders</option>
            <option value="placed">Order Placed</option>
            <option value="prepared">Order Prepared</option>
            <option value="on-the-way">On Its Way</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
          <p className="text-stone-600 text-lg">
            {statusFilter === 'all' 
              ? 'No delivery orders found.' 
              : `No orders with status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order) => {
            const trackingState = mapOrderStatusToTrackingState(order.status);
            const eta = calculateETA(order.status, order.created_at);
            const badgeColor = getTrackingStatusBadgeColor(trackingState);
            
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-stone-800 mb-1">
                      Order #{order.id}
                    </h3>
                    <p className="text-sm text-stone-600">
                      Customer: {order.customerName || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                    {trackingState.label}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-stone-700">
                    <span className="font-medium">Status:</span> {trackingState.message}
                  </p>
                  
                  {eta && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Estimated Arrival
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {eta.minutes}
                      </p>
                      <p className="text-sm text-blue-700">
                        Expected at around {eta.time}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-stone-500">
                    Last updated: {formatLastUpdated(order.updated_at || order.created_at)}
                  </p>
                </div>

                {order.delivery_address && (
                  <div className="border-t border-stone-200 pt-4 mt-4">
                    <p className="text-xs text-stone-500 mb-1">Delivery Address:</p>
                    <p className="text-sm text-stone-700">{order.delivery_address}</p>
                  </div>
                )}

                <div className="border-t border-stone-200 pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-600">Total:</span>
                    <span className="text-lg font-bold text-stone-800">
                      EGP {parseFloat(order.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

