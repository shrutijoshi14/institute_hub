import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing state on mount (without token validation for now)
    const storedUser = sessionStorage.getItem('user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const userObj = {
      id: userData.id || userData.userId,
      name: userData.name,
      role: userData.role,
      username: userData.username || null,
      childId: userData.childId || null,
      children: userData.children || [],
      token: userData.token || null,
      mustChangePassword: !!userData.mustChangePassword
    };
    sessionStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const markPasswordChanged = () => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, mustChangePassword: false };
      sessionStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const switchChild = (childId) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, childId };
      sessionStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role, login, logout, switchChild, markPasswordChanged, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
