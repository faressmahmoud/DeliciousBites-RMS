import { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const RoleAuthContext = createContext(null);

// Hardcoded role mapping
const ROLE_EMAILS = {
  'manager@example.com': 'manager',
  'kitchen@example.com': 'kitchen',
  'waiter@example.com': 'waiter',
  'reception@example.com': 'reception',
  'delivery@example.com': 'delivery',
};

// Role to route mapping
export const ROLE_ROUTES = {
  manager: '/admin/dashboard',
  kitchen: '/kitchen-dashboard',
  waiter: '/waiter-dashboard',
  reception: '/reception-dashboard',
  delivery: '/delivery-dashboard',
};

export function RoleAuthProvider({ children }) {
  const [staffUser, setStaffUser] = useState(() => {
    const saved = localStorage.getItem('staffRoleUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (staffUser) {
      localStorage.setItem('staffRoleUser', JSON.stringify(staffUser));
    } else {
      localStorage.removeItem('staffRoleUser');
    }
  }, [staffUser]);

  const login = async (email, password) => {
    try {
      // Try backend authentication first
      const response = await fetch(`${API_BASE_URL}/staff/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.toLowerCase(), password }),
      });

      if (response.ok) {
        const backendUser = await response.json();
        const user = {
          email: backendUser.email,
          role: backendUser.role,
          name: backendUser.name || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        };
        setStaffUser(user);
        return { success: true, user, route: ROLE_ROUTES[backendUser.role] || ROLE_ROUTES[backendUser.role] };
      } else {
        // Fallback to hardcoded emails for backward compatibility
        const role = ROLE_EMAILS[email.toLowerCase()];
        if (!role) {
          return { success: false, error: 'Invalid email or password.' };
        }

        // For demo accounts, accept default password
        if (password === 'password123') {
          const user = {
            email: email.toLowerCase(),
            role: role,
            name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          };
          setStaffUser(user);
          return { success: true, user, route: ROLE_ROUTES[role] };
        }

        return { success: false, error: 'Invalid email or password.' };
      }
    } catch (error) {
      // Network error - fallback to hardcoded check
      const role = ROLE_EMAILS[email.toLowerCase()];
      if (!role) {
        return { success: false, error: 'Unable to connect to server. Please try again.' };
      }

      // For demo accounts, accept default password
      if (password === 'password123') {
        const user = {
          email: email.toLowerCase(),
          role: role,
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        };
        setStaffUser(user);
        return { success: true, user, route: ROLE_ROUTES[role] };
      }

      return { success: false, error: 'Unable to connect to server. Please try again.' };
    }
  };

  const logout = () => {
    setStaffUser(null);
    localStorage.removeItem('staffRoleUser');
  };

  const hasRole = (requiredRole) => {
    return staffUser?.role === requiredRole;
  };

  const hasAnyRole = (roles) => {
    return staffUser && roles.includes(staffUser.role);
  };

  return (
    <RoleAuthContext.Provider
      value={{
        staffUser,
        login,
        logout,
        hasRole,
        hasAnyRole,
        isAuthenticated: !!staffUser,
      }}
    >
      {children}
    </RoleAuthContext.Provider>
  );
}

export function useRoleAuth() {
  const context = useContext(RoleAuthContext);
  if (!context) {
    throw new Error('useRoleAuth must be used within RoleAuthProvider');
  }
  return context;
}

