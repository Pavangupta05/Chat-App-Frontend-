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
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
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
  if (user) return <Navigate to="/chat" replace />;
  return children;
};

/**
 * OnboardingRoute — Shows onboarding pages to unauthenticated users.
 * Logged-in users are redirected to chat.
 * Note: The ob-seen check only applies to the root "/" redirect (RootRedirect),
 * NOT to direct navigation to /welcome, /features, /how-it-works.
 */
const OnboardingRoute = ({ children }) => {
  const { isLoading, user } = useAuth();
  if (isLoading) return authLoadingFallback;
  if (user) return <Navigate to="/chat" replace />;

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
              {/* ── Onboarding pages (new users only) ─────────────────────────── */}
              <Route
                path="/welcome"
                element={
                  <OnboardingRoute>
                    <LandingPage />
                  </OnboardingRoute>
                }
              />
              <Route
                path="/features"
                element={
                  <OnboardingRoute>
                    <FeaturesPage />
                  </OnboardingRoute>
                }
              />
              <Route
                path="/how-it-works"
                element={
                  <OnboardingRoute>
                    <HowItWorksPage />
                  </OnboardingRoute>
                }
              />

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
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ChatView />} />
                <Route path=":id" element={<ChatView />} />
              </Route>
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <ChatLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<SettingsView />} />
              </Route>
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ChatLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ProfileView />} />
              </Route>

              {/* ── Root redirect logic ─────────────────────────────────────────── */}
              <Route path="/" element={<RootRedirect />} />

              {/* Fallback for any other route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

/**
 * Smart root redirect:
 *  - Logged in      → /chat
 *  - Seen onboarding → /login
 *  - First time     → /welcome (onboarding)
 */
const RootRedirect = () => {
  const { isLoading, user } = useAuth();
  if (isLoading) return authLoadingFallback;
  if (user) return <Navigate to="/chat" replace />;

  const hasSeen = localStorage.getItem("ob-seen");
  if (hasSeen) return <Navigate to="/login" replace />;
  return <Navigate to="/welcome" replace />;
};

export default App;
