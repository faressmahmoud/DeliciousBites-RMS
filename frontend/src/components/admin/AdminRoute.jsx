import { Navigate } from 'react-router-dom';

export default function AdminRoute({ children }) {
  const staffUser = JSON.parse(localStorage.getItem('staffUser') || 'null');
  
  if (!staffUser) {
    return <Navigate to="/staff/login" replace />;
  }
  
  return children;
}

