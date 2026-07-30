// fallback.tsx — WebGL fallback HOC for the 5 Object-family components.
//
// The Object family (AsciiObject, DitheredObject, GlassObject, ParticleObject,
// LiquidObject) instantiates a Three.js `WebGLRenderer` which throws on
// browsers without WebGL2/WebGL support. Coaches on Chromebook, Raspberry
// Pi, or severely throttled Safari builds can hit this. We catch the throw
// inside an ErrorBoundary and render the children unwrapped.
//
// Wrapper components (Asciify, Bend, etc.) use `useSyncExternalStore(
// supportsHtmlInCanvas )` and fall back to copy-of-subtree automatically — no
// HOC needed for the wrapper family.

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface FallbackProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (err: unknown) => void;
}

interface FallbackState {
  failed: boolean;
}

export class WebGLFallbackBoundary extends Component<FallbackProps, FallbackState> {
  state: FallbackState = { failed: false };

  static getDerivedStateFromError(): FallbackState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // D7 honest log: surface to console.error once per failure, never spam.
    console.warn('[canvas-ui/fallback] WebGLRenderer init failed:', error.message);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? <>{this.props.children}</>;
    }
    return this.props.children;
  }
}

/**
 * HOC: wrap any canvas-ui Object component with automatic WebGL fallback.
 * @example
 *   const SafeAsciiObject = withWebGLFallback(AsciiObject);
 */
export function withWebGLFallback<P extends object>(Comp: React.ComponentType<P>) {
  return function SafeCanvasObject(props: P & { children?: ReactNode }) {
    const { children, ...rest } = props as P & { children?: ReactNode };
    return (
      <WebGLFallbackBoundary fallback={children}>
        <Comp {...(rest as P)}>{children}</Comp>
      </WebGLFallbackBoundary>
    );
  };
}
