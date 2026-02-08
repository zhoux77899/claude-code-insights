import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Star,
  GitFork,
  Eye,
  GithubLogo,
  Globe,
  CodeSimple,
  Scales,
  HardDrives,
  GitCommit,
  GitMerge,
  GitPullRequest
} from "@phosphor-icons/react";
import { IssueOpenedIcon } from '@primer/octicons-react'
import { Claude } from '@lobehub/icons';
import type { FormattedRepo } from "../../types/github";
import { formatDate, formatFileSize, formatNumberWithCommas } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import { Card, CardHeader, CardBody, Divider, Chip, Pagination } from "@heroui/react";
import { getStarsHistory } from "../../hooks/useStarsHistory";
import { StarsHistoryChart } from "../charts/StarsHistoryChart";
import { usePluginData } from "../../hooks/usePluginData";
import { PluginCard } from "./PluginCard";

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
  const [isDark, setIsDark] = useState(true);
  const [starsHistory, setStarsHistory] = useState<{ date: string; stars: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [prevRepoFullName, setPrevRepoFullName] = useState(repo.fullName);
  const { pluginData } = usePluginData(repo.fullName, repo.defaultBranch);

  const pluginsPerPage = 1;
  const totalPluginPages = pluginData?.plugins ? Math.ceil(pluginData.plugins / pluginsPerPage) : 0;

  useEffect(() => {
    const loadStarsHistory = async () => {
      if (repo.fullName) {
        const data = await getStarsHistory(repo.fullName);
        setStarsHistory(data);
      }
    };

    loadStarsHistory();
  }, [repo.fullName]);

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(() => {
      checkTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (repo.fullName !== prevRepoFullName) {
      setPrevRepoFullName(repo.fullName);
      setCurrentPage(1);
    }
  }, [repo.fullName, prevRepoFullName]);

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

  const getCurrentPluginIndex = () => {
    return (currentPage - 1) * pluginsPerPage;
  };

  const renderPluginCard = () => {
    if (!pluginData || pluginData.plugins === 0) {
      return (
        <div className="text-center py-8 text-default-500">
          No plugins available for this repository
        </div>
      );
    }

    const index = getCurrentPluginIndex();
    if (index >= pluginData.plugins) return null;

    return (
      <PluginCard
        pluginName={pluginData.pluginNames[index] || ""}
        pluginVersion={pluginData.pluginVersions[index] || ""}
        pluginDescription={pluginData.pluginDescriptions[index] || ""}
        repoName={repo.name}
        isDark={isDark}
      />
    );
  };

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

      <div className="relative w-[960px] max-h-[90vh] rounded-2xl shadow-md overflow-y-auto animate-scale-in pointer-events-auto">
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
              className="w-16 h-16 rounded-full border-2 border-accent object-cover flex-shrink-0"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <h2
                id="modal-title"
                className="font-bold text-lg text-left text-foreground line-clamp-1"
              >
                {repo.name}
              </h2>
              <p className="text-sm text-left text-default-500 truncate">
                @{repo.ownerName}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-1",
                    "text-sm text-accent hover:text-accent/80",
                    "transition-colors duration-200",
                  )}
                >
                  <GithubLogo size={16} weight={isDark ? "regular" : "fill"} />
                  <span>View on GitHub</span>
                </a>
                {repo.homepage && (
                  <a
                    href={repo.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1",
                      "text-sm text-accent hover:text-accent/80",
                      "transition-colors duration-200",
                    )}
                  >
                    <Globe size={16} weight={isDark ? "regular" : "fill"} />
                    <span>Homepage</span>
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4",
                "w-8 h-8 rounded-full",
                "flex items-center justify-center",
                "text-default-500 hover:text-foreground",
                "transition-all duration-200",
              )}
              aria-label="Close modal"
            >
              <X size={20} weight={isDark ? "regular" : "bold"} />
            </button>
          </CardHeader>

          <CardBody className="px-6">
            {repo.topics && repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {repo.topics.map((topic) => (
                  <Chip
                    classNames={{
                      base: "flex items-center justify-center border border-1.5 border-accent",
                      content: "text-accent text-xs",
                    }}
                    key={topic}
                    variant="bordered"
                    size="sm"
                    radius="full"
                  >
                    {topic}
                  </Chip>
                ))}
              </div>
            )}

            <p className="text-sm text-left text-default-600 dark:text-default-600 mb-4 whitespace-pre-wrap break-words">
              {repo.description}
            </p>

            <div className="flex flex-wrap gap-8 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Star size={20} weight={isDark ? "regular" : "fill"} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Stars</p>
                  <p className="font-semibold text-foreground">
                    {formatNumberWithCommas(repo.stars)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <GitFork size={20} weight={isDark ? "regular" : "fill"} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Forks</p>
                  <p className="font-semibold text-foreground">
                    {formatNumberWithCommas(repo.forks)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Eye size={20} weight={isDark ? "regular" : "fill"} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Watchers</p>
                  <p className="font-semibold text-foreground">
                    {formatNumberWithCommas(repo.watchers)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <IssueOpenedIcon size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Open Issues</p>
                  <p className="font-semibold text-foreground">
                    {formatNumberWithCommas(repo.issues)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Claude size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-default-500">Plugins</p>
                  <p className="font-semibold text-foreground">
                    {pluginData?.plugins ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <StarsHistoryChart data={starsHistory} />

            <Divider className="my-4 border border-1 border-default-200" />

            <h3
              id="modal-plugins"
              className="font-bold text-lg text-left text-foreground line-clamp-1"
            >
              Available Plugins
            </h3>

            <div className="mt-4">
              {renderPluginCard()}
            </div>

            {totalPluginPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  initialPage={1}
                  total={totalPluginPages}
                  page={currentPage}
                  onChange={setCurrentPage}
                  size="sm"
                  variant="flat"
                  classNames={{
                    item: "w-6 h-6 rounded-lg bg-accent/10 hover:bg-accent text-xs hover:text-white",
                    cursor: "w-6 h-6 rounded-lg bg-accent text-xs text-white opacity-100",
                  }}
                />
              </div>
            )}

            <Divider className="my-4 border border-1 border-default-200" />

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <CodeSimple size={16} weight={isDark ? "regular" : "bold"} className="text-default-500" />
                  <p className="text-sm text-default-500">Language</p>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span
                  className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0",
                    isDark ? "border-1.5" : undefined
                  )}
                  style={{
                    backgroundColor: isDark ? 'transparent' : repo.languageColor || 'transparent',
                    borderColor: isDark ? repo.languageColor || 'transparent' : undefined
                  }}
                />
                  <span className="text-sm text-foreground">
                    {repo.language ? repo.language : "Unknown"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Scales size={16} weight={isDark ? "regular" : "fill"} className="text-default-500" />
                  <p className="text-sm text-default-500">License</p>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-sm text-foreground">
                    {repo.license ? repo.license : "Unknown"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <HardDrives size={16} weight={isDark ? "regular" : "fill"} className="text-default-500" />
                  <p className="text-sm text-default-500">Size</p>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-sm text-foreground">
                    {formatFileSize(repo.size)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <GitCommit size={16} weight={isDark ? "regular" : "fill"} className="text-default-500" />
                  <p className="text-sm text-default-500">Created At</p>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-sm text-foreground">
                    {formatDate(repo.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <GitMerge size={16} weight={isDark ? "regular" : "fill"} className="text-default-500" />
                  <p className="text-sm text-default-500">Last Updated</p>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-sm text-foreground">
                    {formatDate(repo.updatedAt)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <GitPullRequest size={16} weight={isDark ? "regular" : "fill"} className="text-default-500" />
                  <p className="text-sm text-default-500">Last Pushed</p>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-sm text-foreground">
                    {formatDate(repo.updatedAt)}
                  </span>
                </div>
              </div>
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
