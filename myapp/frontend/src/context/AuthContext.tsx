
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { setAuthToken } from '../config/api';

import {
  disconnectSocket,
  connectSocket,
} from '../services/socket';

import {
  requestNotificationPermission,
  registerFcmToken,
  listenForFcmTokenRefresh,
} from '../services/fcmService';

export type Role = 'user' | 'seller' | 'doctor' | null;

type AuthContextType = {
  token: string | null;
  role: Role;
  user: any;
  loading: boolean;
  needsWomenOnboarding: boolean;
  login: (data: {
    token: string;
    role: Role;
    user: any;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Keeps only one active FCM token refresh listener.
  const fcmRefreshUnsubscribe = useRef<(() => void) | null>(null);

  // Prevents delayed FCM setup from running after logout.
  const authSessionRef = useRef(0);

  /* ===============================
     FCM SETUP
  =============================== */
  const setupFcmForAccount = async (
    accountRole: Role,
    sessionId: number
  ) => {
    // Current /user/save-fcm endpoint supports User accounts.
    // Patients and assistants both use the User collection.
    if (accountRole !== 'user') {
      console.log(`FCM registration skipped for role: ${accountRole}`);
      return;
    }

    try {
      const permissionGranted =
        await requestNotificationPermission();

      if (sessionId !== authSessionRef.current) return;

      if (!permissionGranted) {
        console.log('FCM permission not granted');
        return;
      }

      await registerFcmToken();

      if (sessionId !== authSessionRef.current) return;

      // Remove previous listener before creating another.
      fcmRefreshUnsubscribe.current?.();

      fcmRefreshUnsubscribe.current =
        listenForFcmTokenRefresh();

      console.log('✅ User FCM setup complete');
    } catch (error) {
      console.log('FCM setup error:', error);
    }
  };

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
          const restoredRole = storedRole as Role;

          setToken(storedToken);
          setRole(restoredRole);
          setAuthToken(storedToken);

          if (storedUser) {
            const parsedUser = JSON.parse(storedUser);

            setUser(parsedUser);

            // SOCKET REGISTER
            const socket = connectSocket();
            socket.emit('register_user', parsedUser._id);

            // FCM SETUP
            const currentSession = authSessionRef.current;

            setTimeout(() => {
              void setupFcmForAccount(
                restoredRole,
                currentSession
              );
            }, 1000);
          }
        }
      } catch (error) {
        console.log('Auth restore error:', error);
      } finally {
        setLoading(false);
      }
    };

    void restoreAuth();

    return () => {
      fcmRefreshUnsubscribe.current?.();
      fcmRefreshUnsubscribe.current = null;
    };
  }, []);

  /* ===============================
     LOGIN
  =============================== */
  const login = async (data: {
    token: string;
    role: Role;
    user: any;
  }) => {
    console.log('🔥 AUTH CONTEXT LOGIN CALLED');

    // Start a new authenticated session.
    const currentSession = ++authSessionRef.current;

    // Stop any previous FCM listener.
    fcmRefreshUnsubscribe.current?.();
    fcmRefreshUnsubscribe.current = null;

    setToken(data.token);
    setRole(data.role);
    setUser(data.user);
    setAuthToken(data.token);

    await AsyncStorage.multiSet([
      ['token', data.token],
      ['role', data.role ?? ''],
      ['user', JSON.stringify(data.user)],
    ]);

    console.log('✅ Storage saved');

    // SOCKET REGISTER
    const socket = connectSocket();
    socket.emit('register_user', data.user._id);

    // FCM SETUP
    setTimeout(() => {
      void setupFcmForAccount(
        data.role,
        currentSession
      );
    }, 1000);
  };

  /* ===============================
     LOGOUT
  =============================== */
  const logout = async () => {
    // Invalidate any pending FCM setup.
    authSessionRef.current += 1;

    // Stop FCM token refresh listener.
    fcmRefreshUnsubscribe.current?.();
    fcmRefreshUnsubscribe.current = null;

    disconnectSocket();
    setAuthToken(null);

    setToken(null);
    setRole(null);
    setUser(null);

    await AsyncStorage.multiRemove([
      'token',
      'role',
      'user',
    ]);
  };

  /* ===============================
     REFRESH USER
  =============================== */
  const refreshUser = async () => {
    try {
      const res = await API.get('/user/profile');

      setUser(res.data);

      await AsyncStorage.setItem(
        'user',
        JSON.stringify(res.data)
      );
    } catch (error) {
      console.log('Failed to refresh user:', error);
    }
  };

  /* ===============================
     WOMEN ONBOARDING CHECK
  =============================== */
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
