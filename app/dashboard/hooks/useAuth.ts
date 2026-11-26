import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "../types";
import { loginUser, getCurrentUser } from "../services/api";
import { STORAGE_KEYS } from "../constants";

const AUTO_LOGOUT_TIME =
  process.env.NODE_ENV === "development"
    ? 24 * 60 * 60 * 1000 // 24 hours in local development
    : 30 * 60 * 1000; // 30 minutes in production

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  // Standard user-initiated or explicit logout
  const logout = useCallback(() => {
    clearTimer();
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PAGE);
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
      sessionStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRED);
    }
    setIsLoggedIn(false);
    setUser(null);
  }, [clearTimer]);

  // Inactivity timeout triggers session expired popup
  const triggerSessionExpired = useCallback(() => {
    clearTimer();
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEYS.SESSION_EXPIRED, "1");
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    }
    setSessionExpired(true);
  }, [clearTimer]);

  // Sync initial state and check for existing expired session
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Check if session was already marked expired
    if (sessionStorage.getItem(STORAGE_KEYS.SESSION_EXPIRED) === "1") {
      setSessionExpired(true);
      setUser(getCurrentUser());
      return;
    }

    // 2. Check auth status and elapsed inactivity
    const auth = localStorage.getItem(STORAGE_KEYS.AUTH) === "1";
    if (auth) {
      const lastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      const now = Date.now();
      if (lastActive && now - Number(lastActive) >= AUTO_LOGOUT_TIME) {
        triggerSessionExpired();
        return;
      }
      setIsLoggedIn(true);
      setUser(getCurrentUser());
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, [triggerSessionExpired]);

  // Reset or restart inactivity timer
  const resetLogoutTimer = useCallback(() => {
    if (typeof window === "undefined") return;
    const auth = localStorage.getItem(STORAGE_KEYS.AUTH) === "1";
    if (!auth) return;

    clearTimer();
    logoutTimerRef.current = setTimeout(() => {
      triggerSessionExpired();
    }, AUTO_LOGOUT_TIME);
  }, [clearTimer, triggerSessionExpired]);

  // Set up multi-source activity & visibility tracking
  useEffect(() => {
    if (!isLoggedIn) return;

    const handleActivity = () => {
      if (typeof window === "undefined") return;
      const lastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      const now = Date.now();
      if (lastActive && now - Number(lastActive) >= AUTO_LOGOUT_TIME) {
        triggerSessionExpired();
        return;
      }
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(now));
      resetLogoutTimer();
    };

    // Events that signify user presence
    const events = ["click", "keydown", "scroll", "touchstart", "mousemove"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check when user switches back to tab or focuses window
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleActivity();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleActivity);

    // Periodic heartbeat check every 10 seconds to catch background sleep/wake
    const intervalId = setInterval(() => {
      const lastActive = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      if (lastActive && Date.now() - Number(lastActive) >= AUTO_LOGOUT_TIME) {
        triggerSessionExpired();
      }
    }, 10000);

    // Initial trigger
    resetLogoutTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleActivity);
      clearInterval(intervalId);
      clearTimer();
    };
  }, [isLoggedIn, resetLogoutTimer, triggerSessionExpired, clearTimer]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const res = await loginUser(email, pass);
    if (res.success && res.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
        sessionStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRED);
      }
      setIsLoggedIn(true);
      setUser(res.user);
      setSessionExpired(false);
      return true;
    }
    return false;
  };

  const role = user?.role?.toLowerCase()?.trim() || null;

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
