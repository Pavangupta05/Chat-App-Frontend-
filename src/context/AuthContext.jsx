import { createContext, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { login as loginService, register as registerService, logout as logoutService } from "../services/authService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("chat-user");
    const storedToken = sessionStorage.getItem("chat-token");

    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          ...parsed,
          id: parsed?.id != null ? String(parsed.id) : "",
        });
        setToken(storedToken);
      } catch {
        logoutService();
        setUser(null);
        setToken(null);
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (userData) => {
    const data = await loginService(userData);
    // Commit user/token before callers run navigate(), so ProtectedRoute sees a session.
    flushSync(() => {
      setUser(data.user);
      setToken(data.token);
    });
    return data;
  };

  const register = async (userData) => {
    const data = await registerService(userData);
    return data;
  };

  const logout = () => {
    logoutService();
    sessionStorage.removeItem("chat-user");
    sessionStorage.removeItem("chat-token");
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
