import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS, MOCK_ROLES } from '../services/mockData';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('aicte_user');
      return stored ? JSON.parse(stored) : MOCK_USERS[0]; // Default to Admin for full demo access
    } catch {
      return MOCK_USERS[0];
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('aicte_token') || 'demo_token');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('aicte_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aicte_user');
    }
  }, [user]);

  const loginAsRole = async (roleName) => {
    setLoading(true);
    try {
      const targetUser = MOCK_USERS.find((u) => u.role === roleName) || MOCK_USERS[0];
      const res = await authAPI.login(targetUser.email, targetUser.role);
      setUser(res.user || targetUser);
      setToken(res.token || 'demo_token');
    } finally {
      setLoading(false);
    }
  };

  const loginWithCredentials = async (email, password) => {
    setLoading(true);
    try {
      const targetUser = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase()) || {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: MOCK_ROLES.INSTITUTION,
        designation: 'Institutional Representative'
      };
      const res = await authAPI.login(email, targetUser.role);
      setUser(res.user || targetUser);
      setToken(res.token || 'demo_token');
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aicte_user');
    localStorage.removeItem('aicte_token');
  };

  const hasRole = (...allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginAsRole,
        loginWithCredentials,
        logout,
        hasRole,
        isAdmin: user?.role === MOCK_ROLES.ADMIN,
        isReviewer: user?.role === MOCK_ROLES.REVIEWER,
        isInstitution: user?.role === MOCK_ROLES.INSTITUTION
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
