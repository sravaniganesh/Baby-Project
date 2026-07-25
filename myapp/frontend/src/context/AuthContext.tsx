import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../config/api';
import { disconnectSocket, connectSocket } from "../services/socket";
import { setAuthToken } from '../config/api';
import {
  requestNotificationPermission,
  registerFcmToken,
} from '../services/fcmService';

export type Role = 'user' | 'seller' | 'doctor' | null;

type AuthContextType = {
  token: string | null;
  role: Role;
  user: any;
  loading: boolean;
  needsWomenOnboarding: boolean;
  login: (data: { token: string; role: Role; user: any }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ===============================
     RESTORE AUTH ON APP START
  =============================== */
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedRole = await AsyncStorage.getItem('role');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedRole) {
          setToken(storedToken);
          setRole(storedRole as Role);
          setAuthToken(storedToken);

          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);

            // 🔔 SOCKET REGISTER
            const socket = connectSocket();
            socket.emit("register_user", parsedUser._id);

            // 🔔 FCM SAFE INIT (DELAYED)
            setTimeout(async () => {
              try {
                console.log("🔔 Restored user - starting FCM setup...");
                await requestNotificationPermission();
                await registerFcmToken();
                console.log("✅ FCM restore setup complete");
              } catch (err) {
                console.log("FCM restore error:", err);
              }
            }, 1000);
          }
        }
      } catch (e) {
        console.log('Auth restore error', e);
      } finally {
        setLoading(false);
      }
    };

    restoreAuth();
  }, []);

  /* ===============================
     LOGIN
  =============================== */
  const login = async (data: { token: string; role: Role; user: any }) => {
    console.log("🔥 AUTH CONTEXT LOGIN CALLED");
    console.log("🚀 LOGIN FUNCTION TRIGGERED");

    setToken(data.token);
    setRole(data.role);
    setUser(data.user);
    setAuthToken(data.token);

    await AsyncStorage.multiSet([
      ['token', data.token],
      ['role', data.role ?? ''],
      ['user', JSON.stringify(data.user)],
    ]);

    console.log("✅ Storage saved");

    // 🔔 SOCKET REGISTER
    const socket = connectSocket();
    socket.emit("register_user", data.user._id);

    // 🔔 FCM SAFE INIT (DELAYED)
    setTimeout(async () => {
      try {
        console.log("🔔 Starting FCM setup...");
        await requestNotificationPermission();
        await registerFcmToken();
        console.log("✅ FCM setup complete");
      } catch (err) {
        console.log("FCM setup failed:", err);
      }
    }, 1000);
  };

  /* ===============================
     LOGOUT
  =============================== */
  const logout = async () => {
    disconnectSocket();
    setAuthToken(null);

    setToken(null);
    setRole(null);
    setUser(null);

    await AsyncStorage.multiRemove(['token', 'role', 'user']);
  };

  /* ===============================
     REFRESH USER
  =============================== */
  const refreshUser = async () => {
    try {
      const res = await API.get('/user/profile');
      setUser(res.data);
      await AsyncStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      console.log("Failed to refresh user", err);
    }
  };

  const needsWomenOnboarding =
  role === 'user' &&
  user !== null &&
  user !== undefined &&
  !user?.womenCategory;

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        loading,
        needsWomenOnboarding,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);