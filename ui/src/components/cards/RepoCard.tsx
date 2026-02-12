import React, { useState, useRef, useEffect, useCallback } from "react";
import { Star, GitFork, FileMagnifyingGlass, CopySimple, Check } from "@phosphor-icons/react";
import type { FormattedRepo, SortOption } from "../../types/github";
import { formatNumber } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import { CanvasRevealEffect } from "@/components/ui/canvasRevealEffect";
import { Button, Card, CardHeader, CardBody, CardFooter } from "@heroui/react";
import { RepoDetailModal } from "./RepoDetailModal";
import { useModal } from "../../contexts/ModalContext";

interface RepoCardProps {
  repo: FormattedRepo;
  className?: string;
  sortOption?: SortOption;
  trendingScores?: Map<string, number>;
}

function pluginMarketplace(fullName: string) : string {
  if (fullName === "obra/superpowers") {
    return `/plugin add add ${fullName}-marketplace`;
  }
  return `/plugin marketplace add ${fullName}`;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo, className, sortOption, trendingScores }) => {
  const { isAnyModalOpen, openModal, closeModal } = useModal();
  const [, setMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ rotateX: 0, rotateY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const setRef = useCallback((element: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (element) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setIsInViewport(entry.isIntersecting);
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        },
        { threshold: 0.1, rootMargin: "100px" }
      );
      observerRef.current.observe(element);
    }
  }, []);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (isDetailModalOpen) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setRotation({ rotateX, rotateY });
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    if (isDetailModalOpen) return;
    setRotation({ rotateX: 0, rotateY: 0 });
    setMousePosition({ x: 0, y: 0 });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("/plugin add");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

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
    <div
      ref={(el) => {
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        setRef(el);
      }}
      className={cn(
        "w-[360px] h-[220px] rounded-2xl",
        "bg-card-light dark:bg-card-dark shadow-md",
        "border border-black/10 dark:border-white/10",
        "transition-all duration-100 ease-out",
        "hover:shadow-xl",
        "group relative cursor-pointer",
        "transform-style-3d preserve-3d",
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
        <div className={cn(
          "absolute inset-0 transition-all duration-500",
          "group-hover:opacity-50 backdrop-blur-sm",
          "opacity-0"
        )}>
          {isInViewport && (
            <CanvasRevealEffect
              key={`canvas-${repo.id}`}
              animationSpeed={2}
              opacities={[0.2, 0.2, 0.3, 0.4, 0.5, 0.5, 0.6, 0.7, 0.8, 1]}
              colors={[[203, 124, 91]]}
              dotSize={3}
              showGradient={false}
              containerClassName="h-full w-full bg-card-light/0 dark:bg-card-dark/0"
            />
          )}
        </div>
      </div>

      <Card
        classNames={{
          base: "w-full h-full border-0 shadow-none bg-transparent",
          header: "border-0 shadow-none bg-transparent",
          body: "border-0 shadow-none bg-transparent py-2 pb-24",
          footer: "border-0 shadow-none bg-transparent",
        }}
      >
        <CardHeader className="relative z-10 p-4 pb-2 flex gap-3 items-start">
          <img
            src={repo.ownerAvatar}
            alt={repo.ownerName}
            className="w-12 h-12 rounded-full border-2 border-accent/30 object-cover flex-shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:border-accent"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg text-left text-foreground truncate transition-colors duration-300 group-hover:text-accent line-clamp-1">
              {repo.name}
            </p>
            <p className="text-sm text-left text-default-500 truncate">
              @{repo.ownerName}
            </p>
          </div>
        </CardHeader>

        <CardBody className="relative z-10 p-3.5 py-2 flex flex-col h-[108px]">
          <p
            className="text-sm text-left text-default-600 dark:text-default-600 line-clamp-3"
            title={repo.description}
          >
            {repo.description}
          </p>
          <div
            className={cn(
              "flex w-full mt-auto items-center justify-between",
              "rounded-md px-1",
              "bg-page-light/50 dark:bg-page-dark/50 backdrop-blur-xs",
              "border border-1.5 border-black/10 dark:border-white/10"
            )}
          >
            <span className="text-xs font-maple-mono text-default-600 dark:text-default-600 truncate">
              {pluginMarketplace(repo.fullName)}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md text-default-500 hover:text-accent transition-colors duration-200"
              aria-label="Copy command"
            >
              {isCopied ? (
                <Check size={12} weight="bold" className="text-success" />
              ) : (
                <CopySimple size={12} weight={isDark ? "regular" : "bold"} />
              )}
            </button>
          </div>
        </CardBody>

        <CardFooter className="absolute bottom-2 h-8 p-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-default-600 dark:text-default-600">
              <Star
                className="text-accent"
                size={16}
                weight={isDark ? "regular" : (repo.stars > 0 ? "fill" : "regular")}
              />
              <span className="text-sm font-medium">
                {sortOption === "trending" && trendingScores?.has(repo.fullName)
                  ? `+${formatNumber(trendingScores.get(repo.fullName) || 0)}`
                  : formatNumber(repo.stars)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-default-600 dark:text-default-600">
              <GitFork
                className="text-accent"
                size={16}
                weight={isDark ? "regular" : (repo.forks > 0 ? "fill" : "regular")}
              />
              <span className="text-sm font-medium">{formatNumber(repo.forks)}</span>
            </div>
          </div>

          <Button
            onPress={(e) => {
              if (e && 'stopPropagation' in e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
              }
              openModal();
              setIsDetailModalOpen(true);
            }}
            disabled={isAnyModalOpen && !isDetailModalOpen}
            className={cn(
              "flex w-[80px] h-6 items-center justify-center gap-1",
              "translate-x-0.5",
              "rounded-full",
              "text-xs font-medium text-accent",
              "border border-1.5 border-accent bg-transparent backdrop-blur-xs",
              "transition-all duration-200",
              isAnyModalOpen && !isDetailModalOpen && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`View details for ${repo.name}`}
            aria-disabled={isAnyModalOpen && !isDetailModalOpen}
            size="sm"
          >
            <FileMagnifyingGlass
              className="text-accent"
              size={12}
              weight={isDark ? "regular" : "fill"}
            />
            Details
          </Button>
        </CardFooter>
      </Card>

      <RepoDetailModal
        repo={repo}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setRotation({ rotateX: 0, rotateY: 0 });
          closeModal();
          setIsDetailModalOpen(false);
        }}
      />
    </div>
  );
};
