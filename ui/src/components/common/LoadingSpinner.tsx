import React from "react";
import { Spinner } from "@heroui/react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "lg",
  label = "Loading...",
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Spinner
        size={size}
        color="primary"
        label={label}
        labelColor="primary"
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-page-light dark:bg-page-dark z-50">
        {content}
      </div>
    );
  }

  return content;
};
