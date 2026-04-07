import React from 'react';

/**
 * ErrorBoundary - catches React component errors
 * Prevents app crashes from propagating
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Optionally reload the page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.title}>⚠️ Something went wrong</h1>
            <p style={styles.message}>
              An unexpected error occurred. The team has been notified.
            </p>
            <details style={styles.details}>
              <summary style={styles.summary}>Error details</summary>
              <pre style={styles.code}>
                {this.state.error?.toString()}
              </pre>
            </details>
            <button onClick={this.handleReset} style={styles.button}>
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '1rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    maxWidth: '500px',
    width: '100%',
  },
  title: {
    margin: '0 0 1rem',
    fontSize: '1.5rem',
    color: '#d32f2f',
  },
  message: {
    margin: '0 0 1.5rem',
    color: '#666',
    lineHeight: 1.5,
  },
  details: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 500,
    color: '#333',
    marginBottom: '0.5rem',
  },
  code: {
    margin: '0.5rem 0 0',
    padding: '0.5rem',
    backgroundColor: '#f5f5f5',
    overflow: 'auto',
    fontSize: '0.85rem',
    color: '#666',
  },
  button: {
    backgroundColor: '#3390ec',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
  },
};

export default ErrorBoundary;
