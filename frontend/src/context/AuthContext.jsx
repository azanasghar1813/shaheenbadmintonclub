import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('shaheen_token');
    if (token) {
      api.post('/auth/verify', { token })
        .then(({ data }) => {
          if (data.valid) setAdmin(data.decoded);
          else localStorage.removeItem('shaheen_token');
        })
        .catch(() => localStorage.removeItem('shaheen_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('shaheen_token', data.token);
    setAdmin({ 
      username: data.username, 
      isGeneral: data.isGeneral, 
      contactName: data.contactName,
      contactNumber: data.contactNumber
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('shaheen_token');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
