import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "../types";
import { loginUser, getCurrentUser } from "../services/api";

const AUTO_LOGOUT_TIME = 5 * 60 * 1000;

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const logoutTimerRef = useRef<any>(null);

  // Sync initial state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("reelscale_auth") === "1";
      setIsLoggedIn(auth);
      setUser(getCurrentUser());
    }
  }, []);

  const logout = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("reelscale_auth");
      localStorage.removeItem("reelscale_user");
      localStorage.removeItem("reelscale_current_page");
    }
    setIsLoggedIn(false);
    setUser(null);
  }, []);

  const resetLogoutTimer = useCallback(() => {
    if (typeof window === "undefined") return;
    const auth = localStorage.getItem("reelscale_auth") === "1";
    if (!auth) return;

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    logoutTimerRef.current = setTimeout(() => {
      setSessionExpired(true);
      logout();
    }, AUTO_LOGOUT_TIME);
  }, [logout]);

  // Set up activity tracking
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleActivity = () => {
      resetLogoutTimer();
    };

    const events = ["click", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Start timer on mount/login
    resetLogoutTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, [isLoggedIn, resetLogoutTimer]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const res = await loginUser(email, pass);
    if (res.success && res.user) {
      setIsLoggedIn(true);
      setUser(res.user);
      setSessionExpired(false);
      return true;
    }
    return false;
  };

  const role = user?.role?.toLowerCase() || null;

  return {
    isLoggedIn,
    user,
    role,
    login,
    logout,
    sessionExpired,
    setSessionExpired,
    resetLogoutTimer,
  };
}
export type UseAuthReturn = ReturnType<typeof useAuth>;
