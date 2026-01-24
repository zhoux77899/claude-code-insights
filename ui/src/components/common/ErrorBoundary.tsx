import { type ReactNode } from "react";
import { Component, type ErrorInfo } from "react";
import { Button } from "@heroui/react";
import { Warning } from "@phosphor-icons/react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-card-light dark:bg-card-dark border border-white/20 dark:border-white/10 acrylic-card max-w-md mx-auto my-8">
          <Warning className="text-accent mb-4" size={48} weight="fill" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-default-500 text-center mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button
            color="primary"
            variant="flat"
            onPress={this.handleReload}
            className="bg-accent/10 text-accent hover:bg-accent/20"
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
