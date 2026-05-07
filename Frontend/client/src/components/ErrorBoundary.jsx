import React from 'react';
import { Settings, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4">
          <div className="nintendo-card max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-[#E60012]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="w-8 h-8 text-[#E60012] animate-spin-slow" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-3">System Error</h1>
            <p className="text-gray-600 mb-8">
              An unexpected error occurred. Please reload the application to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#E60012] hover:bg-[#CC0010] text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
