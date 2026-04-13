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
    minHeight: '100dvh',
    backgroundColor: '#000000',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '1rem',
  },
  card: {
    backgroundColor: 'rgba(20, 20, 20, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    border: '1px solid #1f1f1f',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    padding: '2rem',
    maxWidth: '500px',
    width: '100%',
  },
  title: {
    margin: '0 0 1rem',
    fontSize: '1.5rem',
    color: '#ff595a',
  },
  message: {
    margin: '0 0 1.5rem',
    color: '#ffffff',
    lineHeight: 1.5,
  },
  details: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    borderRadius: '4px',
    border: '1px solid #1f1f1f',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 500,
    color: '#3390ec',
    marginBottom: '0.5rem',
  },
  code: {
    margin: '0.5rem 0 0',
    padding: '0.5rem',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    overflow: 'auto',
    fontSize: '0.85rem',
    color: '#999999',
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
