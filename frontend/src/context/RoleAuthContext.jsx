import { createContext, useContext, useState, useEffect } from 'react';

const RoleAuthContext = createContext(null);

// Hardcoded role mapping
const ROLE_EMAILS = {
  'manager@example.com': 'manager',
  'kitchen@example.com': 'kitchen',
  'waiter@example.com': 'waiter',
  'reception@example.com': 'reception',
};

// Role to route mapping
export const ROLE_ROUTES = {
  manager: '/admin/dashboard',
  kitchen: '/kitchen-dashboard',
  waiter: '/waiter-dashboard',
  reception: '/reception-dashboard',
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

  const login = (email) => {
    const role = ROLE_EMAILS[email.toLowerCase()];
    if (!role) {
      return { success: false, error: 'Email not recognized.' };
    }

    const user = {
      email: email.toLowerCase(),
      role: role,
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
    };

    setStaffUser(user);
    return { success: true, user, route: ROLE_ROUTES[role] };
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

