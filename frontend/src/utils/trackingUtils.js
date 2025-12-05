// Shared tracking utilities for consistent status mapping and ETA calculation

export const TRACKING_STATES = {
  PLACED: {
    key: 'placed',
    label: 'Order Placed',
    message: 'Your order has been placed.',
    icon: '📦',
  },
  PREPARED: {
    key: 'prepared',
    label: 'Order Prepared',
    message: 'Your order is prepared and ready for pickup.',
    icon: '✅',
  },
  ON_THE_WAY: {
    key: 'on-the-way',
    label: 'On Its Way',
    message: 'Your order is on its way.',
    icon: '🚚',
  },
  DELIVERED: {
    key: 'delivered',
    label: 'Delivered',
    message: 'Your order has been delivered.',
    icon: '🎉',
  },
};

/**
 * Maps order status to tracking state
 */
export function mapOrderStatusToTrackingState(status) {
  const statusMap = {
    'pending': TRACKING_STATES.PLACED,
    'preparing': TRACKING_STATES.PLACED,
    'completed': TRACKING_STATES.PREPARED,
    'ready-to-serve': TRACKING_STATES.PREPARED,
    'ready': TRACKING_STATES.PREPARED,
    'verified': TRACKING_STATES.PREPARED,
    'out-for-delivery': TRACKING_STATES.ON_THE_WAY,
    'out_for_delivery': TRACKING_STATES.ON_THE_WAY,
    'delivered': TRACKING_STATES.DELIVERED,
  };
  return statusMap[status] || TRACKING_STATES.PLACED;
}

/**
 * Calculates ETA for an order that is out for delivery
 * Returns null if order is not out for delivery
 */
export function calculateETA(status, createdAt) {
  if (status !== 'out-for-delivery' && status !== 'out_for_delivery') {
    return null;
  }
  
  // Calculate ETA: 25-30 minutes from when order went out for delivery
  const now = new Date();
  const created = new Date(createdAt);
  const minutesSinceCreation = Math.floor((now - created) / (1000 * 60));
  
  // If order was just marked out for delivery, estimate 25-30 minutes
  // Otherwise, reduce ETA based on time elapsed
  const baseETA = 30;
  const remainingMinutes = Math.max(5, baseETA - minutesSinceCreation);
  const minMinutes = Math.max(5, remainingMinutes - 5);
  const maxMinutes = remainingMinutes;
  
  // Calculate expected arrival time
  const arrivalTime = new Date(now.getTime() + remainingMinutes * 60000);
  const hours = arrivalTime.getHours();
  const minutes = arrivalTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  const formattedTime = `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  
  return {
    minutes: `${minMinutes}-${maxMinutes} minutes`,
    time: formattedTime,
    arrivalTime: arrivalTime.toISOString(),
  };
}

/**
 * Gets the status badge color classes for a tracking state
 */
export function getTrackingStatusBadgeColor(trackingState) {
  const colorMap = {
    'placed': 'bg-blue-100 text-blue-800',
    'prepared': 'bg-yellow-100 text-yellow-800',
    'on-the-way': 'bg-purple-100 text-purple-800',
    'delivered': 'bg-green-100 text-green-800',
  };
  return colorMap[trackingState.key] || 'bg-stone-100 text-stone-800';
}

/**
 * Formats a date/time string for display
 */
export function formatLastUpdated(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

