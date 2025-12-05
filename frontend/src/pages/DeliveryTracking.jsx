import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE_URL, API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  TRACKING_STATES,
  mapOrderStatusToTrackingState,
  calculateETA,
} from '../utils/trackingUtils';

export default function DeliveryTracking() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeliveredToast, setShowDeliveredToast] = useState(false);
  const [wasDelivered, setWasDelivered] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    const socket = io(API_URL);
    
    // Listen for order status changes
    socket.on('orderStatusChanged', ({ orderId: changedOrderId, status }) => {
      if (parseInt(changedOrderId) === parseInt(orderId)) {
        loadTrackingData();
        
        // Show toast when order is delivered
        if (status === 'delivered' && !wasDelivered) {
          setWasDelivered(true);
          setShowDeliveredToast(true);
          setTimeout(() => setShowDeliveredToast(false), 5000);
        }
      }
    });

    loadTrackingData();

    return () => socket.disconnect();
  }, [orderId, wasDelivered]);

  const loadTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`);
      if (!response.ok) {
        throw new Error('Failed to load tracking information');
      }
      
      const data = await response.json();
      setTrackingData(data);
      
      // Check if order was just delivered
      if (data.status === 'delivered' && !wasDelivered) {
        setWasDelivered(true);
        setShowDeliveredToast(true);
        setTimeout(() => setShowDeliveredToast(false), 5000);
      }
    } catch (err) {
      console.error('Error loading tracking data:', err);
      setError(err.message || 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-amber-50 to-stone-50 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl text-stone-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="bg-gradient-to-b from-amber-50 to-stone-50 min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl text-red-600 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => navigate('/my-orders')}
            className="bg-stone-800 text-amber-50 px-6 py-3 rounded-lg hover:bg-stone-700 transition-colors"
          >
            Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  const currentState = mapOrderStatusToTrackingState(trackingData.status);
  const eta = calculateETA(trackingData.status, trackingData.createdAt || trackingData.created_at);
  const allStates = [
    TRACKING_STATES.PLACED,
    TRACKING_STATES.PREPARED,
    TRACKING_STATES.ON_THE_WAY,
    TRACKING_STATES.DELIVERED,
  ];
  const currentStateIndex = allStates.findIndex(s => s.key === currentState.key);

  return (
    <div className="bg-gradient-to-b from-amber-50 to-stone-50 min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/my-orders')}
            className="text-stone-600 hover:text-stone-800 mb-4 flex items-center gap-2"
          >
            ← Back to My Orders
          </button>
          <h1 className="text-3xl font-bold text-stone-800">Track Your Order</h1>
          <p className="text-stone-600 mt-2">Order #{orderId}</p>
        </div>

        {/* Delivered Toast */}
        {showDeliveredToast && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold">Your order has been delivered!</p>
                <p className="text-sm">Enjoy your meal!</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
          <div className="text-center">
            <div className="text-6xl mb-4">{currentState.icon}</div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">{currentState.label}</h2>
            <p className="text-stone-600 text-lg">{currentState.message}</p>
          </div>
        </div>

        {/* ETA Display (only when on the way) */}
        {eta && currentState.key === 'on-the-way' && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-xl font-bold text-blue-800 mb-2">Estimated Arrival</h3>
            <p className="text-3xl font-bold text-blue-900 mb-1">
              {eta.minutes}
            </p>
            <p className="text-blue-700">
              Expected at around {eta.time}
            </p>
          </div>
        )}

        {/* Status Stepper */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
          <h3 className="text-lg font-semibold text-stone-800 mb-6">Order Progress</h3>
          <div className="relative space-y-6">
            {allStates.map((state, index) => {
              const isCompleted = index < currentStateIndex;
              const isCurrent = index === currentStateIndex;
              
              return (
                <div key={state.key} className="relative flex items-start gap-4">
                  {/* Vertical Connector Line (between states) */}
                  {index < allStates.length - 1 && (
                    <div 
                      className={`absolute left-6 w-0.5 ${
                        index < currentStateIndex ? 'bg-green-500' : 'bg-stone-200'
                      }`}
                      style={{ top: '3rem', height: '1.5rem' }}
                    />
                  )}
                  
                  {/* Icon/Status Indicator */}
                  <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                    isCompleted 
                      ? 'bg-green-500 text-white shadow-md' 
                      : isCurrent
                      ? 'bg-blue-500 text-white shadow-md ring-4 ring-blue-200'
                      : 'bg-stone-200 text-stone-400'
                  }`}>
                    {isCompleted ? '✓' : state.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h4 className={`font-semibold text-base ${
                      isCurrent ? 'text-stone-800' : isCompleted ? 'text-stone-700' : 'text-stone-400'
                    }`}>
                      {state.label}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      isCurrent ? 'text-stone-600 font-medium' : isCompleted ? 'text-stone-500' : 'text-stone-400'
                    }`}>
                      {state.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        {trackingData.orderTotal && (
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Order Summary</h3>
            <div className="space-y-2 text-stone-700">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-semibold">EGP {parseFloat(trackingData.orderTotal).toFixed(2)}</span>
              </div>
              {trackingData.deliveryAddress && (
                <div className="flex justify-between">
                  <span>Delivery Address:</span>
                  <span className="text-right max-w-xs">{trackingData.deliveryAddress}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

