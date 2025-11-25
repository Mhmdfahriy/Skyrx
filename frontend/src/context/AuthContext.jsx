import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    const parsed = stored ? JSON.parse(stored) : null;
    return parsed;
  });

  const [loadingUser, setLoadingUser] = useState(true);

  // Helper avatar
  const buildAvatarUrl = (avatarData) => {
    if (!avatarData) return 'http://127.0.0.1:8000/storage/avatar/default-avatar.png';
    if (avatarData.startsWith('http')) return avatarData;
    if (avatarData === 'default-avatar.png') {
      return 'http://127.0.0.1:8000/storage/avatar/default-avatar.png';
    }
    return `http://127.0.0.1:8000/storage/avatar/${avatarData}`;
  };

  // Sinkronisasi ke localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  // Fetch user dari API
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return null;
      }

      const res = await api.get('/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchedUser = res.data?.user || null;

      if (fetchedUser) {
        fetchedUser.avatar = buildAvatarUrl(fetchedUser.avatar);
        setUser(fetchedUser);

        try {
          localStorage.setItem('user', JSON.stringify(fetchedUser));
        } catch {}
      }

      return fetchedUser;
    } catch {
      setUser(null);
      return null;
    }
  };

  // Login - PERBAIKAN: Langsung set user dari response tanpa fetchUser
  const login = async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });

      const token = response.data.token;
      const userData = response.data.user;

      // Set token ke localStorage dan axios header
      localStorage.setItem('token', token);
      localStorage.setItem('role', userData.role);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Langsung set user dari response (dengan avatar yang sudah di-build)
      const userWithAvatar = {
        ...userData,
        avatar: buildAvatarUrl(userData.avatar)
      };

      setUser(userWithAvatar);
      localStorage.setItem('user', JSON.stringify(userWithAvatar));

      // Return user langsung agar bisa digunakan untuk redirect
      return userWithAvatar;
    } catch (err) {
      throw err;
    }
  };

  // Register
  const register = async (formData) => {
    try {
      const response = await api.post('/register', formData);

      const token = response.data.token;
      const userData = response.data.user;

      localStorage.setItem('token', token);
      localStorage.setItem('role', userData.role || 'user');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const userWithAvatar = {
        ...userData,
        avatar: buildAvatarUrl(userData.avatar)
      };

      setUser(userWithAvatar);
      localStorage.setItem('user', JSON.stringify(userWithAvatar));

      return userWithAvatar;
    } catch (err) {
      throw err;
    }
  };

  // Refresh user
  const checkAuth = async () => {
    return await fetchUser();
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Update state user (misal update avatar / profil)
  const updateUser = (newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };

      if (updated.avatar) {
        if (!updated.avatar.startsWith('http')) {
          updated.avatar = buildAvatarUrl(updated.avatar);
        }
      } else {
        updated.avatar = 'http://127.0.0.1:8000/storage/avatar/default-avatar.png';
      }

      try {
        localStorage.setItem('user', JSON.stringify(updated));
      } catch {}

      return updated;
    });
  };

  // Auto fetch saat mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    checkAuth().finally(() => {
      setLoadingUser(false);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, register, updateUser, logout, checkAuth, loadingUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);