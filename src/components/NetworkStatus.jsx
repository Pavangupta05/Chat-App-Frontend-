import { useEffect, useState } from 'react';

/**
 * NetworkStatus - monitors network connectivity
 * Shows notifications when connection is lost or restored
 */
function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('📡 Connection restored');
      setIsOnline(true);
      setWasOffline(true);
      // Auto-hide notification after 3 seconds
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      console.log('📴 Connection lost');
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!wasOffline) return null;

  if (!isOnline) {
    return (
      <div style={styles.offlineBanner}>
        <div style={styles.content}>
          <span style={styles.icon}>📴</span>
          <span>You are offline. Some features may be limited.</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.onlineBanner}>
      <div style={styles.content}>
        <span style={styles.icon}>✓</span>
        <span>Connection restored</span>
      </div>
    </div>
  );
}

const styles = {
  offlineBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#f44336',
    color: 'white',
    padding: '0.75rem',
    textAlign: 'center',
  },
  onlineBanner: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '0.75rem',
    textAlign: 'center',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '1.2rem',
  },
};

export default NetworkStatus;
