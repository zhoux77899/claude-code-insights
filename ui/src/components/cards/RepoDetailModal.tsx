import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Star, GitFork, Link as LinkIcon, Calendar, Scales } from "@phosphor-icons/react";
import type { FormattedRepo } from "../../types/github";
import { formatNumber, formatDate } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import { Card, CardHeader, CardBody } from "@heroui/react";

interface RepoDetailModalProps {
  repo: FormattedRepo;
  isOpen: boolean;
  onClose: () => void;
}

export const RepoDetailModal: React.FC<RepoDetailModalProps> = ({
  repo,
  isOpen,
  onClose,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
      document.body.style.pointerEvents = "none";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
      document.body.style.pointerEvents = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-transparent backdrop-blur-md animate-fade-in pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in pointer-events-auto">
        <Card
          classNames={{
            base: cn(
              "w-full rounded-2xl",
              "bg-card-light/50 dark:bg-card-dark/50",
              "border border-black/10 dark:border-white/10",
              "animate-slide-up"
            ),
            header: "border-0 shadow-none bg-transparent pb-0",
            body: "border-0 shadow-none bg-transparent py-4",
            footer: "border-0 shadow-none bg-transparent pt-0",
          }}
        >
          <CardHeader className="flex gap-4 px-6 pt-6 relative">
            <img
              src={repo.ownerAvatar}
              alt={repo.ownerName}
              className="w-16 h-16 rounded-full border-2 border-accent/30 object-cover flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <h2
                id="modal-title"
                className="font-bold text-xl text-left text-foreground line-clamp-2"
              >
                {repo.name}
              </h2>
              <p className="text-sm text-left text-default-500 truncate">
                {repo.ownerName}
              </p>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4",
                "w-8 h-8 rounded-full",
                "flex items-center justify-center",
                "text-default-500 hover:text-foreground",
                "hover:bg-default-100 dark:hover:bg-white/10",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-accent"
              )}
              aria-label="Close modal"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </CardHeader>

          <CardBody className="px-6">
            <p className="text-sm text-left text-default-600 dark:text-default-600 mb-4 whitespace-pre-wrap break-words">
              {repo.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {repo.language && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-default-100 dark:bg-white/10">
                  {repo.languageColor && (
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: repo.languageColor }}
                    />
                  )}
                  <span className="text-sm text-foreground">
                    {repo.language}
                  </span>
                </div>
              )}
              {repo.license && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-default-100 dark:bg-white/10">
                  <Scales className="w-4 h-4 text-accent" />
                  <span className="text-sm text-foreground">
                    {repo.license}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-default-50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Stars</p>
                  <p className="font-semibold text-foreground">
                    {formatNumber(repo.stars)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <GitFork className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Forks</p>
                  <p className="font-semibold text-foreground">
                    {formatNumber(repo.forks)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-default-500">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Updated {formatDate(repo.updatedAt)}</span>
              </div>
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2",
                  "text-sm text-accent hover:text-accent/80",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                  "focus:ring-offset-card-light dark:focus:ring-offset-card-dark",
                  "rounded-md"
                )}
              >
                <LinkIcon className="w-4 h-4 flex-shrink-0" />
                <span>View on GitHub</span>
              </a>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modalContent, document.body);
};
