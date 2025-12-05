import { Navigate } from 'react-router-dom';
import { useRoleAuth } from '../../context/RoleAuthContext';

export default function AdminRoute({ children }) {
  const { isAuthenticated, staffUser } = useRoleAuth();
  const legacyStaffUser = JSON.parse(localStorage.getItem('staffUser') || 'null');
  
  // Allow access if:
  // 1. User is logged in via RoleAuth (manager role or any role-based login)
  // 2. OR user is logged in via legacy staff login
  // Manager role is treated as admin
  const hasAccess = isAuthenticated || legacyStaffUser;
  
  if (!hasAccess) {
    return <Navigate to="/staff-role-login" replace />;
  }
  
  return children;
}

