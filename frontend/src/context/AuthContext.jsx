import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('vpn_admin_token'));

  const login = (newToken) => {
    localStorage.setItem('vpn_admin_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('vpn_admin_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
