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

  // 🔄 Load user from sessionStorage on refresh
  useEffect(() => {
    // Failsafe: Ensure loading stops after 5s no matter what
    const failsafe = setTimeout(() => {
      if (isLoading) {
        console.warn("⚠️ Auth loading failsafe triggered");
        setIsLoading(false);
      }
    }, 5000);

    try {
      const storedUser = localStorage.getItem("chat-user");
      const storedToken = localStorage.getItem("chat-token");

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          id: parsedUser?.id ? String(parsedUser.id) : "",
        });
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Session restore failed:", error);
      logoutService();
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

    // ✅ Save session
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

    // Sync to storage
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
    localStorage.setItem("chat-user", JSON.stringify(normalizedUser));
    localStorage.setItem("chat-token", data.token);

    return data;
  };

  // 🚪 LOGOUT
  const logout = () => {
    logoutService();
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