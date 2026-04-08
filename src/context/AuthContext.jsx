import { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
} from "../services/authService";

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
      const storedUser = sessionStorage.getItem("chat-user");
      const storedToken = sessionStorage.getItem("chat-token");

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
      sessionStorage.clear();
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
    sessionStorage.setItem("chat-user", JSON.stringify(normalizedUser));
    sessionStorage.setItem("chat-token", data.token);

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

    return data;
  };

  // 🚪 LOGOUT
  const logout = () => {
    logoutService();
    sessionStorage.clear();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
  };

  // ⏳ Prevent app render until auth is ready
  if (isLoading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};