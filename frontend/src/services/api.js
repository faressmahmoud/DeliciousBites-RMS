const API_BASE_URL = 'http://localhost:5001/api';

export async function fetchMenu() {
  const response = await fetch(`${API_BASE_URL}/menu`);
  if (!response.ok) {
    throw new Error('Failed to fetch menu');
  }
  return response.json();
}

export async function fetchMenuByCategory(category) {
  const response = await fetch(`${API_BASE_URL}/menu/${category}`);
  if (!response.ok) {
    throw new Error('Failed to fetch menu');
  }
  return response.json();
}

// Auth API (Phone + OTP)
export async function signupUser(phone, name) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, name }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }
  
  return response.json();
}

export async function verifyOTP(phone, otp) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, otp }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'OTP verification failed');
  }
  
  return response.json();
}

export async function requestLoginOTP(phone) {
  const response = await fetch(`${API_BASE_URL}/auth/login/request-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to request OTP');
  }
  
  return response.json();
}

export async function verifyLoginOTP(phone, otp) {
  const response = await fetch(`${API_BASE_URL}/auth/login/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone, otp }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'OTP verification failed');
  }
  
  return response.json();
}

// Reservation API
export async function createReservation(reservationData) {
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reservationData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create reservation');
  }
  
  return response.json();
}

// Order API
export async function createOrder(orderData) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create order');
  }
  
  return response.json();
}

export async function fetchUserOrders(userId) {
  const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }
  return response.json();
}

// Reservations API
export async function fetchUserReservations(userId) {
  const response = await fetch(`${API_BASE_URL}/reservations/user/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch reservations');
  }
  return response.json();
}

