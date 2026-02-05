/**
 * MapErrorBoundary - Catches errors specifically from Leaflet map rendering
 * Provides a graceful fallback instead of crashing the entire page
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackHeight?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MapErrorBoundary] Map rendering error:', error.message);
    console.error('[MapErrorBoundary] Error details:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="flex flex-col items-center justify-center gap-4"
          style={{ 
            height: this.props.fallbackHeight || '500px',
            background: 'linear-gradient(135deg, #0a1628 0%, #0d1e36 50%, #0a1628 100%)',
            borderRadius: '0.75rem',
          }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-8 w-8 text-primary/50" />
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-1">
              Interactive map temporarily unavailable
            </p>
            <p className="text-muted-foreground/60 text-xs">
              Location data is still accessible below
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="mt-2 bg-background/10 border-border/30 hover:bg-background/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;
