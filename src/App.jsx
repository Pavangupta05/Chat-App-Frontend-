import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ChatLayout from "./components/ChatLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";

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
  if (isLoading) {
    return authLoadingFallback;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AuthRoute = ({ children }) => {
  const { isLoading, user } = useAuth();
  if (isLoading) {
    return authLoadingFallback;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ChatLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
