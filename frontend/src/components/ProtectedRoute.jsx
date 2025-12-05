import { Navigate, useLocation } from 'react-router-dom';
import { useRoleAuth } from '../context/RoleAuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, staffUser } = useRoleAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/staff-role-login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(staffUser.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

