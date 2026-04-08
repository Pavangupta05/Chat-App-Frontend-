import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("🚀 Neon Relay: Frontend JS Execution Started");

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('🔴 Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🔴 Unhandled promise rejection:', event.reason);
  // Prevent the error from crashing the app
  event.preventDefault();
});

// Log when service worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      console.log('📝 Service worker update available');
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
