import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL, API_URL } from '../../config/api';
import menuData from '../../data/menuData';

// Helper function to get item name by ID from menuData
function getItemNameById(id) {
  if (!id && id !== 0) return null;
  
  // Try to convert to number if it's a string
  let numericId;
  if (typeof id === 'string') {
    numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;
  } else {
    numericId = id;
  }
  
  // Find item in menuData
  const item = menuData.find(m => m.id === numericId);
  return item ? item.name : null;
}

// Helper function to get item name by price (fallback when menu_item_id is missing)
function getItemNameByPrice(price) {
  if (!price) return null;
  // Find item in menuData that matches the price (allowing small rounding differences)
  const item = menuData.find(m => Math.abs(m.priceEGP - price) < 0.01);
  return item ? item.name : null;
}

// Helper function to extract menu item ID from order item
function getMenuItemId(item) {
  if (!item) return null;
  
  // Try multiple possible fields in order of preference
  // menu_item_id is the actual menu item ID we need
  // item.id might be the order_item ID, not the menu item ID
  if (item.menu_item_id !== undefined && item.menu_item_id !== null) {
    return item.menu_item_id;
  }
  if (item.menuItemId !== undefined && item.menuItemId !== null) {
    return item.menuItemId;
  }
  if (item.menuItem?.id !== undefined && item.menuItem?.id !== null) {
    return item.menuItem.id;
  }
  // Only use item.id as last resort (might be order_item ID, not menu_item ID)
  // But first check if it exists in menuData - if not, it's probably order_item ID
  if (item.id !== undefined && item.id !== null) {
    const existsInMenu = menuData.some(m => m.id === item.id);
    if (existsInMenu) {
      return item.id;
    }
  }
  return null;
}

export default function KitchenDisplayScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'oldest'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'preparing', 'completed'

  useEffect(() => {
    const socket = io(API_URL);
    
    socket.on('newOrder', (newOrder) => {
      const orderStatus = newOrder.status || 'pending';
      if (orderStatus === 'pending' || orderStatus === 'preparing') {
        setOrders(prev => {
          const exists = prev.find(o => o.id === newOrder.id);
          if (exists) {
            return prev;
          }
          
          let itemsArray = Array.isArray(newOrder.items) ? newOrder.items : 
                          (typeof newOrder.items === 'string' ? JSON.parse(newOrder.items) : []);
          
          const formattedOrder = {
            ...newOrder,
            status: orderStatus,
            items: itemsArray
          };
          
          return [formattedOrder, ...prev];
        });
      }
    });

    socket.on('orderStatusChanged', ({ orderId, status }) => {
      setOrders(prev => {
        const updated = prev.map(order => 
          order.id === orderId ? { ...order, status } : order
        );
        return updated;
      });
    });

    socket.on('kitchenOrderUpdate', ({ orderId, itemId, status }) => {
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const updatedItems = order.items.map(item => 
            item.id === itemId ? { ...item, status } : item
          );
          return { ...order, items: updatedItems };
        }
        return order;
      }));
    });

    loadOrders();

    return () => socket.disconnect();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // Try /api/kitchen/orders first, fallback to /api/admin/orders if it doesn't exist
      // Note: 404 errors will still appear in browser console (browser-level behavior)
      // but the code handles it gracefully by falling back to admin endpoint
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/kitchen/orders`);
      } catch (fetchError) {
        // Network error - fall through to admin endpoint
        response = { status: 404, ok: false };
      }
      
      // If kitchen endpoint returns 404 or any error, use admin endpoint instead
      if (!response.ok || response.status === 404) {
        // Load all order statuses (pending, preparing, completed)
        const [pendingResponse, preparingResponse, completedResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/orders?status=pending&timeRange=all`),
          fetch(`${API_BASE_URL}/admin/orders?status=preparing&timeRange=all`),
          fetch(`${API_BASE_URL}/admin/orders?status=completed&timeRange=all`)
        ]);
        
        if (!pendingResponse.ok || !preparingResponse.ok || !completedResponse.ok) {
          throw new Error('Failed to load orders');
        }
        
        const pendingData = await pendingResponse.json();
        const preparingData = await preparingResponse.json();
        const completedData = await completedResponse.json();
        
        // Combine and deduplicate all orders
        const allOrders = [...pendingData, ...preparingData, ...completedData];
        const uniqueOrders = allOrders.filter((order, index, self) => 
          index === self.findIndex(o => o.id === order.id)
        );
        
        setOrders(uniqueOrders);
        return;
      }
      
      const data = await response.json();
      
      // If kitchen endpoint only returns pending/preparing, also fetch completed orders
      const completedResponse = await fetch(`${API_BASE_URL}/admin/orders?status=completed&timeRange=all`);
      let completedData = [];
      if (completedResponse.ok) {
        completedData = await completedResponse.json();
      }
      
      // Combine all orders
      const allOrdersData = [...data, ...completedData];
      const uniqueOrdersData = allOrdersData.filter((order, index, self) => 
        index === self.findIndex(o => o.id === order.id)
      );
      
      setOrders(uniqueOrdersData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      let url = `${API_BASE_URL}/kitchen/orders/${orderId}/status`;
      
      let response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 404) {
        url = `${API_BASE_URL}/admin/orders/${orderId}/status`;
        response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
      }

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to update order status';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch (e) {
            // Ignore JSON parse errors
          }
        }
        
        alert(errorMessage);
        return;
      }
      
      // Update local state immediately for better UX
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // Reload orders to get fresh data
      await loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status: ' + error.message);
    }
  };

  const updateItemStatus = async (itemId, newStatus) => {
    try {
      // Update local state FIRST for immediate visual feedback
      setOrders(prev => prev.map(order => {
        if (order.items && Array.isArray(order.items)) {
          const hasItem = order.items.some(i => i.id === itemId);
          if (hasItem) {
            const updatedItems = order.items.map(i => 
              i.id === itemId ? { ...i, status: newStatus } : i
            );
            return { ...order, items: updatedItems };
          }
        } else if (order.items && typeof order.items === 'string') {
          try {
            const itemsArray = JSON.parse(order.items);
            const hasItem = itemsArray.some(i => i.id === itemId);
            if (hasItem) {
              const updatedItems = itemsArray.map(i => 
                i.id === itemId ? { ...i, status: newStatus } : i
              );
              return { ...order, items: updatedItems };
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        return order;
      }));

      // Try kitchen endpoint first, fallback if needed
      let url = `${API_BASE_URL}/kitchen/order-items/${itemId}/status`;
      
      let response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      // If kitchen endpoint returns 404, update is already done locally
      if (response.status === 404) {
        return;
      }

      if (!response.ok) {
        // State is already updated, just log the error
        return;
      }
    } catch (error) {
      // State is already updated, so don't show error to user
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'New',
      preparing: 'In Progress',
      completed: 'Ready to Serve',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-blue-500',
      preparing: 'bg-yellow-500',
      completed: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getOrderTypeLabel = (serviceMode) => {
    const labels = {
      'dine-in': 'Dine-In',
      'delivery': 'Delivery',
      'pick-up': 'Pick-Up',
    };
    return labels[serviceMode] || serviceMode;
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => statusFilter === 'all' || order.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else {
        return new Date(a.created_at) - new Date(b.created_at);
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-3xl text-stone-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-4xl font-bold text-stone-800">Kitchen Display</h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <label className="text-lg font-medium text-stone-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 text-lg border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Filter Control */}
            <div className="flex items-center gap-2">
              <label className="text-lg font-medium text-stone-700">Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 text-lg border-2 border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                <option value="all">All Orders</option>
                <option value="pending">New</option>
                <option value="preparing">In Progress</option>
                <option value="completed">Ready to Serve</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <p className="text-2xl text-stone-600">No active orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            // Parse items if string, ensure it's an array
            let items = [];
            if (typeof order.items === 'string') {
              try {
                items = JSON.parse(order.items);
              } catch (e) {
                items = [];
              }
            } else if (Array.isArray(order.items)) {
              items = order.items;
            }
            
            const allItemsReady = items.every(item => item.status === 'completed');
            
            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg border-4 border-stone-200 p-6 hover:border-amber-400 transition-colors"
              >
                {/* Order Header */}
                <div className="mb-4 pb-4 border-b-2 border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-bold text-stone-800">Order #{order.id}</h2>
                    <span className={`px-4 py-2 rounded-full text-lg font-bold text-white ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-3 py-1 bg-stone-200 text-stone-800 rounded-lg text-lg font-medium">
                      {getOrderTypeLabel(order.service_mode)}
                    </span>
                    {order.reservation_id && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-lg font-medium">
                        Reservation #{order.reservation_id}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-stone-100 text-stone-700 rounded-lg text-lg">
                      {formatTime(order.created_at)}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-stone-700 mb-3">Items:</h3>
                  <ul className="space-y-2">
                    {items.map((item, idx) => {
                      // Get menu_item_id from item (try multiple possible fields)
                      const menuItemId = getMenuItemId(item);
                      let itemName = getItemNameById(menuItemId);
                      
                      // If name not found by ID, try to find by price (fallback)
                      if (!itemName && item.price) {
                        itemName = getItemNameByPrice(item.price);
                      }
                      
                      // Final fallback
                      if (!itemName) {
                        itemName = 'Unknown Item';
                      }
                      
                      return (
                        <li
                          key={idx}
                          className={`p-3 rounded-lg border-2 ${
                            item.status === 'completed'
                              ? 'bg-green-50 border-green-300'
                              : item.status === 'preparing'
                              ? 'bg-yellow-50 border-yellow-300'
                              : 'bg-blue-50 border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xl font-semibold text-stone-800">
                              {item.quantity}x {itemName}
                            </span>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              item.status === 'completed' ? 'bg-green-200 text-green-800' :
                              item.status === 'preparing' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                          {item.notes && item.notes.trim() && (
                            <p className="text-sm text-stone-600 italic mt-1 font-medium bg-amber-50 px-2 py-1 rounded">
                              📝 Notes: {item.notes}
                            </p>
                          )}
                          {order.status === 'completed' ? (
                            <div className="mt-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium text-center border-2 border-green-300">
                              ✓ Item Completed
                            </div>
                          ) : item.status !== 'completed' ? (
                            <button
                              onClick={async () => {
                                await updateItemStatus(item.id, 'completed');
                              }}
                              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Complete Item
                            </button>
                          ) : (
                            <div className="mt-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium text-center border-2 border-green-300">
                              ✓ Item Completed
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Order Actions */}
                <div className="pt-4 border-t-2 border-stone-200">
                  {order.status === 'pending' && (
                    <button
                      onClick={async () => {
                        setOrders(prev => prev.map(o => 
                          o.id === order.id ? { ...o, status: 'preparing' } : o
                        ));
                        await updateOrderStatus(order.id, 'preparing');
                      }}
                      className="w-full px-6 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-xl font-bold"
                    >
                      Start Preparing
                    </button>
                  )}
                  
                  {order.status === 'preparing' && (
                    <button
                      onClick={async () => {
                        setOrders(prev => prev.map(o => 
                          o.id === order.id ? { ...o, status: 'completed' } : o
                        ));
                        await updateOrderStatus(order.id, 'completed');
                      }}
                      className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                      disabled={!allItemsReady}
                    >
                      {allItemsReady ? 'Complete Order' : `Complete All Items First (${items.filter(i => i.status !== 'completed').length} remaining)`}
                    </button>
                  )}
                  
                  {order.status === 'completed' && (
                    <div className="w-full px-6 py-4 bg-green-100 text-green-800 rounded-lg text-xl font-bold text-center border-2 border-green-300">
                      ✓ Order Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
