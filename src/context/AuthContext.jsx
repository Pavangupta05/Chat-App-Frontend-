import { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  login as loginService,
  register as registerService,
  googleLogin as googleLoginService,
  logout as logoutService,
} from "../services/authService";
import { registerAuthErrorHandler } from "../utils/retry";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

/* eslint-disable react-refresh/only-export-components */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
/* eslint-enable react-refresh/only-export-components */

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 🚦 GLOBAL AUTH ERROR HANDLER (Injected into retryFetch)
  // NOTE: This handler is only called via triggerAuthError() which is reserved
  // for explicit auth failures (e.g. login rejected). Regular API fetches (messages,
  // chats) should NEVER call this — they handle 401/404 locally to prevent
  // unintended logouts during an active chat session.
  useEffect(() => {
    const handleAuthError = () => {
      console.warn("🚨 AuthContext: Session expired. Redirecting to login.");
      // Do not show an alert() — it blocks the UI and confuses mobile users
      logout();
      navigate("/login", { replace: true });
    };

    registerAuthErrorHandler(handleAuthError);
    return () => registerAuthErrorHandler(null);
  }, [navigate]);

  // 🔄 Load user from localStorage on refresh
  useEffect(() => {
    // Failsafe: Ensure loading stops after 5s no matter what
    const failsafe = setTimeout(() => {
      if (isLoading) {
        console.warn("⚠️ Auth loading failsafe triggered");
        setIsLoading(false);
      }
    }, 5000);

    /** Decode JWT payload and check if it is expired (client-side only) */
    const isTokenExpired = (token) => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 < Date.now();
      } catch {
        return true; // Treat malformed tokens as expired
      }
    };

    try {
      // 1. Prioritize Tab-Specific Session Storage
      let storedUser = sessionStorage.getItem("chat-user");
      let storedToken = sessionStorage.getItem("chat-token");

      // 2. Fallback to LocalStorage (Persist across browser restart)
      if (!storedUser || !storedToken) {
        storedUser = localStorage.getItem("chat-user");
        storedToken = localStorage.getItem("chat-token");
        
        // If restoring from localStorage, bring it into this tab's sessionStorage
        if (storedUser && storedToken && !isTokenExpired(storedToken)) {
          sessionStorage.setItem("chat-user", storedUser);
          sessionStorage.setItem("chat-token", storedToken);
        }
      }

      if (storedUser && storedToken && !isTokenExpired(storedToken)) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          id: parsedUser?.id ? String(parsedUser.id) : "",
        });
        setToken(storedToken);
      } else if (storedToken && isTokenExpired(storedToken)) {
        // Token is expired — clear stale session gracefully
        console.warn("⚠️ Auth: Session token expired. Clearing.");
        sessionStorage.removeItem("chat-user");
        sessionStorage.removeItem("chat-token");
        localStorage.removeItem("chat-user");
        localStorage.removeItem("chat-token");
      }
    } catch (error) {
      console.error("Session restore failed:", error);
      logoutService();
      sessionStorage.removeItem("chat-user");
      sessionStorage.removeItem("chat-token");
      localStorage.removeItem("chat-user");
      localStorage.removeItem("chat-token");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
      clearTimeout(failsafe);
    }
  }, []);

  // 🔐 LOGIN
  const login = async (userData) => {
    const data = await loginService(userData);

    const normalizedUser = {
      ...data.user,
      id: data.user?.id ? String(data.user.id) : "",
    };

    flushSync(() => {
      setUser(normalizedUser);
      setToken(data.token);
    });

    // ✅ Save session to BOTH (session for tab isolation, local for persistence)
    sessionStorage.setItem("chat-user", JSON.stringify(normalizedUser));
    sessionStorage.setItem("chat-token", data.token);
    localStorage.setItem("chat-user", JSON.stringify(normalizedUser));
    localStorage.setItem("chat-token", data.token);

    return data;
  };

  // 🆕 REGISTER (auto login)
  const register = async (userData) => {
    const data = await registerService(userData);

    const normalizedUser = {
      ...data.user,
      id: data.user?.id ? String(data.user.id) : "",
    };

    flushSync(() => {
      setUser(normalizedUser);
      setToken(data.token);
    });

    sessionStorage.setItem("chat-user", JSON.stringify(normalizedUser));
    sessionStorage.setItem("chat-token", data.token);
    localStorage.setItem("chat-user", JSON.stringify(normalizedUser));
    localStorage.setItem("chat-token", data.token);

    return data;
  };

  // 🔄 UPDATE USER DATA (Sync state + session)
  const updateUser = (newData) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      ...newData,
      id: String(user.id), // Preserve ID consistency
    };

    flushSync(() => {
      setUser(updatedUser);
    });

    // Sync to BOTH storage systems
    sessionStorage.setItem("chat-user", JSON.stringify(updatedUser));
    localStorage.setItem("chat-user", JSON.stringify(updatedUser));
  };

  const googleLogin = async (googleIdToken) => {
    const data = await googleLoginService(googleIdToken);

    const normalizedUser = {
      ...data.user,
      id: data.user?.id ? String(data.user.id) : "",
    };

    flushSync(() => {
      setUser(normalizedUser);
      setToken(data.token);
    });

    // Save session
    sessionStorage.setItem("chat-user", JSON.stringify(normalizedUser));
    sessionStorage.setItem("chat-token", data.token);
    localStorage.setItem("chat-user", JSON.stringify(normalizedUser));
    localStorage.setItem("chat-token", data.token);

    return data;
  };

  // 🚪 LOGOUT
  const logout = () => {
    logoutService();
    sessionStorage.removeItem("chat-user");
    sessionStorage.removeItem("chat-token");
    localStorage.removeItem("chat-user");
    localStorage.removeItem("chat-token");
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
  };

  // ⏳ Prevent app render until auth is ready
  if (isLoading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};