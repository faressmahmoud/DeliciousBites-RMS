export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
export const API_BASE_URL = `${API_URL}/api`;

if (import.meta.env.DEV) {
  console.log('API_BASE_URL:', API_BASE_URL);
}

