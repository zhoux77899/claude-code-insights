import React, { useState, useRef } from "react";
import { Card } from "@heroui/react";
import { Star, GitFork } from "@phosphor-icons/react";
import type { FormattedRepo } from "../../types/github";
import { formatNumber } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import { useLazyLoad } from "../../hooks/useLazyLoad";

interface RepoCardProps {
  repo: FormattedRepo;
  className?: string;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo, className }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const { isVisible, setRef } = useLazyLoad({ threshold: 0.1 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  if (!isVisible) {
    return (
      <div
        ref={setRef}
        className={cn(
          "w-[360px] h-[220px] rounded-2xl bg-card-light dark:bg-card-dark",
          "border border-white/20 dark:border-white/10",
          "animate-pulse",
          className
        )}
      />
    );
  }

  return (
    <Card
      ref={(el) => {
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        setRef(el);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "w-[360px] h-[220px] overflow-hidden rounded-2xl",
        "bg-card-light dark:bg-card-dark",
        "border border-white/20 dark:border-white/10",
        "transition-all duration-300 ease-out",
        "hover:shadow-xl hover:shadow-accent/10",
        "group relative cursor-pointer",
        className
      )}
      disableAnimation
      isPressable
      onPress={() => window.open(repo.url, "_blank", "noopener,noreferrer")}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(203, 124, 91, 0.15), transparent 70%)`,
        }}
      />

      <div className="p-4 h-full flex flex-col">
        <div className="flex items-start gap-3 mb-2">
          <img
            src={repo.ownerAvatar}
            alt={repo.ownerName}
            className="w-12 h-12 rounded-full border-2 border-accent/30 object-cover flex-shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:border-accent"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-lg text-foreground truncate transition-colors duration-300 group-hover:text-accent"
              title={repo.name}
            >
              {repo.name}
            </h3>
            <p className="text-sm text-default-500 truncate">{repo.ownerName}</p>
          </div>
        </div>

        <p
          className="text-sm text-default-600 dark:text-default-400 line-clamp-3 mb-3 flex-shrink-0"
          title={repo.description}
        >
          {repo.description}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-default-600 dark:text-default-400">
              <Star className="text-accent" size={16} weight={repo.stars > 0 ? "fill" : "regular"} />
              <span className="text-sm font-medium">{formatNumber(repo.stars)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-default-600 dark:text-default-400">
              <GitFork className="text-accent" size={16} weight={repo.forks > 0 ? "fill" : "regular"} />
              <span className="text-sm font-medium">{formatNumber(repo.forks)}</span>
            </div>
          </div>

          {repo.language && (
            <div className="flex items-center gap-1.5">
              {repo.languageColor && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: repo.languageColor }}
                />
              )}
              <span className="text-sm text-default-600 dark:text-default-400 truncate max-w-[100px]">
                {repo.language}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
