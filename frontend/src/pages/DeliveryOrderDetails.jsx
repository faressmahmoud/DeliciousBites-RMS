import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useRoleAuth } from '../context/RoleAuthContext';
import { API_BASE_URL, API_URL } from '../config/api';
import menuData from '../data/menuData';

function getItemNameById(id) {
  if (!id && id !== 0) return null;
  let numericId;
  if (typeof id === 'string') {
    numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;
  } else {
    numericId = id;
  }
  const item = menuData.find(m => m.id === numericId);
  return item ? item.name : null;
}

export default function DeliveryOrderDetails() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { staffUser, logout } = useRoleAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [startingDelivery, setStartingDelivery] = useState(false);
  const [confirmationPin, setConfirmationPin] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [editingAddress, setEditingAddress] = useState(false);

  useEffect(() => {
    const socket = io(API_URL);
    
    socket.on('orderStatusChanged', ({ orderId: changedOrderId, status }) => {
      if (changedOrderId === parseInt(orderId)) {
        setOrder(prev => prev ? { ...prev, status } : null);
      }
    });

    loadOrder();

    return () => socket.disconnect();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/delivery/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to load order');
      }
      const data = await response.json();
      setOrder(data);
      // Set delivery address from order
      setDeliveryAddress(data.deliveryAddress || data.delivery_address || '');
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!order) return;
    
    try {
      setVerifying(true);
      const response = await fetch(`${API_BASE_URL}/delivery/orders/${orderId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify order');
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      console.error('Error verifying order:', err);
      alert(err.message || 'Failed to verify order');
    } finally {
      setVerifying(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!order) return;

    // Guard: Order must be verified before starting delivery
    if (!order.verified) {
      alert('Please verify the order before starting delivery.');
      return;
    }

    try {
      setStartingDelivery(true);
      const url = `${API_BASE_URL}/delivery/orders/${orderId}/start-delivery`;
      console.log('Starting delivery - calling:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to start delivery';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error('Error parsing JSON error response:', parseError);
            errorMessage = `Server error: ${response.status}`;
          }
        } else {
          // If not JSON, read as text
          try {
            const text = await response.text();
            console.error('Non-JSON error response:', text);
            errorMessage = text || `Server error: ${response.status}`;
          } catch (textError) {
            console.error('Error reading error response:', textError);
            errorMessage = `Server error: ${response.status}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Delivery started successfully:', data);
      setOrder(data);
      alert('Order marked as out for delivery!');
    } catch (err) {
      console.error('Error starting delivery:', err);
      alert(err.message || 'Failed to start delivery. Please check the console for details.');
    } finally {
      setStartingDelivery(false);
    }
  };

  const handleDeliver = async () => {
    if (!order) return;

    // Guard: Order must be verified before delivery
    if (!order.verified) {
      alert('Please verify the order before marking it as delivered.');
      return;
    }

    // Validate PIN is not empty
    if (!confirmationPin.trim()) {
      alert('Please enter the confirmation PIN.');
      return;
    }

    // PIN validation is handled on the backend

    try {
      setDelivering(true);
      const response = await fetch(`${API_BASE_URL}/delivery/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationMethod: 'PIN',
          confirmationPin: confirmationPin.trim(),
        }),
      });

      if (!response.ok) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to mark order as delivered';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            errorMessage = `Server error: ${response.status}`;
          }
        } else {
          // If not JSON, read as text
          try {
            const text = await response.text();
            errorMessage = text || `Server error: ${response.status}`;
          } catch (textError) {
            errorMessage = `Server error: ${response.status}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setOrder(data);
      alert('Order marked as delivered successfully!');
      navigate('/delivery-dashboard');
    } catch (err) {
      console.error('Error delivering order:', err);
      alert(err.message || 'Failed to mark order as delivered');
    } finally {
      setDelivering(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!order) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: deliveryAddress.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update delivery address');
      }

      const data = await response.json();
      setOrder(data);
      setEditingAddress(false);
      alert('Delivery address updated successfully!');
    } catch (err) {
      console.error('Error updating address:', err);
      alert(err.message || 'Failed to update delivery address');
    }
  };

  const handleAcknowledge = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/orders/${orderId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Notification acknowledged, but don't update order state
        console.log('Notification acknowledged');
      }
    } catch (err) {
      console.error('Error acknowledging notification:', err);
    }
  };

  useEffect(() => {
    if (order) {
      handleAcknowledge();
    }
  }, [order]);

  const handleLogout = () => {
    logout();
    navigate('/staff-role-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center">
        <p className="text-2xl text-stone-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-red-600 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/delivery-dashboard')}
            className="px-6 py-3 bg-stone-800 text-amber-50 rounded-lg hover:bg-stone-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : 
               (typeof order.items === 'string' ? JSON.parse(order.items) : []);

  const isVerified = order.verified === 1 || order.verified === true;
  const isOutForDelivery = order.status === 'out-for-delivery' || order.status === 'out_for_delivery';
  const canStartDelivery = isVerified && order.status === 'completed';
  // Can deliver when: verified AND (out-for-delivery OR completed/verified status) AND not already delivered
  const canDeliver = isVerified && (isOutForDelivery || order.status === 'completed') && order.status !== 'delivered';

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50">
      {/* Header */}
      <div className="bg-stone-800 text-amber-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Order #{order.id} Details</h1>
              <p className="text-stone-400 text-sm mt-1">
                Welcome, {staffUser?.name || 'Delivery Staff'}
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Badge */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              order.status === 'completed' ? 'bg-green-100 text-green-800' :
              order.status === 'verified' ? 'bg-purple-100 text-purple-800' :
              order.status === 'delivered' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              Status: {order.status === 'completed' ? 'Ready for Pickup' :
                      order.status === 'verified' ? 'Verified' :
                      order.status === 'delivered' ? 'Delivered' :
                      order.status}
            </span>
            {isVerified && (
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                ✓ Verified
              </span>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-stone-800 mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-stone-600 font-medium">Customer Name:</span>
              <p className="text-stone-800 mt-1">{order.customerName || 'N/A'}</p>
            </div>
            <div>
              <span className="text-stone-600 font-medium">Phone:</span>
              <p className="text-stone-800 mt-1">{order.customerPhone || 'N/A'}</p>
            </div>
            <div>
              <div className="flex justify-between items-start">
                <span className="text-stone-600 font-medium">Delivery Address:</span>
                {!editingAddress && (
                  <button
                    onClick={() => setEditingAddress(true)}
                    className="text-stone-600 hover:text-stone-800 text-sm"
                  >
                    {order.deliveryAddress || order.delivery_address ? 'Edit' : 'Add'}
                  </button>
                )}
              </div>
              {editingAddress ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter delivery address"
                    rows={3}
                    className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdateAddress}
                      className="px-4 py-2 bg-stone-800 text-amber-50 rounded-lg hover:bg-stone-700 transition-colors text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingAddress(false);
                        setDeliveryAddress(order.deliveryAddress || order.delivery_address || '');
                      }}
                      className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-stone-800 mt-1">
                  {order.deliveryAddress || order.delivery_address || 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-stone-800 mb-4">Order Items</h2>
          <div className="space-y-4">
            {items.map((item) => {
              const itemName = getItemNameById(item.menu_item_id || item.menuItemId || item.id);
              return (
                <div key={item.id} className="flex justify-between items-center pb-4 border-b border-stone-100 last:border-b-0">
                  <div>
                    <h3 className="font-medium text-stone-800">
                      {itemName || 'Unknown Item'}
                    </h3>
                    <p className="text-sm text-stone-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-stone-800 font-medium">
                    EGP {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-stone-200">
            <div className="flex justify-between text-lg font-bold text-stone-800">
              <span>Total:</span>
              <span>EGP {order.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        {!isVerified && order.status === 'completed' && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Order Verification</h2>
            <p className="text-stone-600 mb-4">
              Please verify that you have all the items before proceeding with delivery.
            </p>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying...' : 'Mark as Verified'}
            </button>
          </div>
        )}

        {/* Start Delivery Section */}
        {canStartDelivery && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Start Delivery</h2>
            <p className="text-stone-600 mb-4">
              You have verified the order. Click below to mark it as out for delivery.
            </p>
            <button
              onClick={handleStartDelivery}
              disabled={startingDelivery}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startingDelivery ? 'Marking as Out for Delivery...' : 'Mark as Out for Delivery'}
            </button>
          </div>
        )}

        {/* Delivery Confirmation Section */}
        {canDeliver && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Delivery Confirmation</h2>
            <p className="text-stone-600 mb-4">
              Confirm that the customer has received the order by entering the confirmation PIN provided to the customer.
            </p>

            {order.confirmation_pin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Expected PIN:</span> <span className="font-mono font-bold">{order.confirmation_pin}</span>
                </p>
              </div>
            )}

            {/* Confirmation PIN Input */}
            <div className="mb-4">
              <label className="block text-stone-700 font-medium mb-2">
                Confirmation PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={confirmationPin}
                onChange={(e) => setConfirmationPin(e.target.value)}
                placeholder="Enter confirmation PIN"
                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleDeliver}
              disabled={delivering || !confirmationPin.trim()}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {delivering ? 'Confirming Delivery...' : 'Mark as Delivered'}
            </button>
          </div>
        )}

        {/* Already Delivered */}
        {order.status === 'delivered' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-green-800 mb-2">✓ Order Delivered</h2>
            {order.customer_confirmation && (
              <p className="text-green-700">
                Confirmation: {order.customer_confirmation}
              </p>
            )}
            {order.delivered_at && (
              <p className="text-green-700 text-sm mt-2">
                Delivered at: {new Date(order.delivered_at).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/delivery-dashboard')}
            className="px-6 py-3 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

