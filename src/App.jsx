import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import NetworkStatus from "./components/NetworkStatus";
import ChatLayout from "./components/ChatLayout";
import ChatView from "./components/ChatView";
import SettingsView from "./components/SettingsView";
import ProfileView from "./components/ProfileView";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./App.css";
import "./Theme.css";

const GOOGLE_CLIENT_ID = "618267599250-5crnmlpitemupuqoctu06q8pl6govrqi.apps.googleusercontent.com";

const authLoadingFallback = (
  <div className="auth-container" role="status" aria-live="polite">
    <div className="auth-card" style={{ textAlign: "center", padding: "2rem" }}>
      <span className="auth-spinner" style={{ margin: "0 auto 1rem" }} />
      <p style={{ margin: 0, color: "var(--text-secondary)" }}>Loading session…</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isLoading, user } = useAuth();
  if (isLoading) return authLoadingFallback;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { isLoading, user } = useAuth();
  if (isLoading) return authLoadingFallback;
  if (user) return <Navigate to="/" replace />;
  return children;
};

function App() {
  useEffect(() => {
    // Hide the native bootstrap loader once React is ready
    if (typeof window.hideAppLoader === "function") {
      // Delay slightly for smooth transition
      const timer = setTimeout(() => window.hideAppLoader(), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <BrowserRouter>
          <AuthProvider>
            <NetworkStatus />
            {/* ... other code matches exactly below ... */}
            <Routes>
              {/* ── Auth pages (redirect to chat if already logged in) ─────────── */}
              <Route
                path="/login"
                element={
                  <AuthRoute>
                    <Login />
                  </AuthRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <AuthRoute>
                    <Register />
                  </AuthRoute>
                }
              />

              {/* ── Password reset (always public — no JWT required) ────────────── */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* ── Protected chat & Main App Shell ─────────────────────────────────── */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <ChatLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ChatView />} />
                <Route path="chat/:id" element={<ChatView />} />
                <Route path="settings" element={<SettingsView />} />
                <Route path="profile" element={<ProfileView />} />
              </Route>
              
              {/* Fallback for any other route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
