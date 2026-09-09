import React, { createContext, useContext, useEffect, useState } from 'react';
import * as api from '@/services/api';
import { registerForPushNotifications, unregisterPushNotifications } from '@/services/notifications';

type Account = Record<string, any>;

interface AuthContextType {
  account: Account | null;
  token: string | null;
  isLoading: boolean;
  /** Has this Merchant connected an Instagram account?
   *  Drives the (onboarding) "Connect Instagram" gate. */
  isInstagramConnected: boolean;
  signIn: (token: string, account: Account) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccount: (account: Account) => void;
  setIsInstagramConnected: (connected: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstagramConnected, setIsInstagramConnected] = useState(false);

  useEffect(() => {
    (async () => {
      // Wrapped in try/catch/finally so a thrown error here (SecureStore
      // unavailable, an unexpected response shape, etc.) can never leave
      // isLoading stuck at true — which would strand the app on Splash
      // forever with no error visibly surfaced. Logged loudly so it shows
      // up in the Metro terminal instead of just an unhandled-rejection.
      let resolved = false;
      try {
        const t = await api.getToken();
        if (!t) {
          setIsLoading(false);
          resolved = true;
          return;
        }

        // 1. Restore from SecureStore instantly — no network needed.
        const cached = await api.getCachedAccount();
        if (cached) {
          setToken(t);
          setAccount(cached);
          setIsInstagramConnected(!!cached.instagram_connected);
          setIsLoading(false); // UI unblocks immediately
          resolved = true;
          registerForPushNotifications();
        }

        // 2. Refresh profile in the background.
        const res = await api.getMe();
        if (res.status === 200 && res.data?.account) {
          const fresh = res.data.account;
          setToken(t);
          setAccount(fresh);
          setIsInstagramConnected(!!fresh.instagram_connected);
          await api.saveAccount(fresh);
          if (!cached) {
            setIsLoading(false);
            resolved = true;
            registerForPushNotifications();
          }
        } else if (!cached) {
          // Token expired/invalid and nothing cached to fall back on.
          await api.clearToken();
          setToken(null);
          setAccount(null);
          setIsLoading(false);
          resolved = true;
        }
      } catch (err) {
        console.error('[auth] startup check failed — falling back to signed-out', err);
        setToken(null);
        setAccount(null);
      } finally {
        if (!resolved) setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async (t: string, a: Account) => {
    await api.setToken(t);
    await api.saveAccount(a);
    setToken(t);
    setAccount(a);
    setIsInstagramConnected(!!a.instagram_connected);
    registerForPushNotifications();
  };

  const signOut = async () => {
    await api.removePushToken().catch(() => {}); // best-effort — needs the still-valid token
    await unregisterPushNotifications();
    await api.logout().catch(() => {});
    await api.clearToken();
    setToken(null);
    setAccount(null);
    setIsInstagramConnected(false);
  };

  const refreshAccount = (a: Account) => {
    setAccount(a);
    setIsInstagramConnected(!!a.instagram_connected);
    api.saveAccount(a); // keep SecureStore in sync, fire-and-forget
  };

  return (
    <AuthContext.Provider
      value={{
        account,
        token,
        isLoading,
        isInstagramConnected,
        signIn,
        signOut,
        refreshAccount,
        setIsInstagramConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
