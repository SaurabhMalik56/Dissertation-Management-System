import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">
            {this.props.fallbackTitle || "Something went wrong"}
          </h3>
          <div className="text-sm text-red-700">
            {this.props.fallbackMessage || (
              <p>
                There was an error rendering this component. Please try refreshing the page.
                If the issue persists, contact support.
              </p>
            )}
            {this.props.showError && (
              <details className="mt-3">
                <summary className="cursor-pointer">Technical Details</summary>
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallbackTitle: PropTypes.string,
  fallbackMessage: PropTypes.node,
  showError: PropTypes.bool
};

ErrorBoundary.defaultProps = {
  showError: process.env.NODE_ENV !== 'production'
};

export default ErrorBoundary; 