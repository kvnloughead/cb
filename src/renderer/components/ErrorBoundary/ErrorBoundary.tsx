import { Component, ErrorInfo, ReactNode, captureOwnerStack } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public override state: ErrorBoundaryState = {
    hasError: false,
  };

  /** Update state so the next render will show the fallback UI. */
  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    const ownerStack = captureOwnerStack();

    console.error(error, info.componentStack);
    if (ownerStack) {
      console.error(`Owner stack: ${ownerStack}`);
    }
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="error-boundary" role="alert">
            <h2 className="error-boundary__title">Something went wrong</h2>
            <div className="error-boundary__actions">
              <button type="button" onClick={() => window.location.reload()}>
                🔄 Reload app
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
