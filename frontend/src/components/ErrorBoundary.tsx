import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '50vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
          }}
        >
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              textAlign: 'center',
              backdropFilter: 'blur(20px)',
            }}
          >
            <AlertTriangle size={48} color="#f87171" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Something went wrong loading this view
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '20px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Return to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={14} /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
