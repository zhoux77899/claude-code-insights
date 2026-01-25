import React, { useState, useRef, useEffect } from "react";
import { Star, GitFork } from "@phosphor-icons/react";
import type { FormattedRepo } from "../../types/github";
import { formatNumber } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import { useLazyLoad } from "../../hooks/useLazyLoad";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";

interface RepoCardProps {
  repo: FormattedRepo;
  className?: string;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo, className }) => {
  const [, setMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ rotateX: 0, rotateY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const { isVisible, setRef } = useLazyLoad({ threshold: 0.1 });
  const [isDark, setIsDark] = useState(true);

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
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    setRotation({ rotateX, rotateY });
    setMousePosition({ x, y });
  };

  const handleMouseLeave = () => {
    setRotation({ rotateX: 0, rotateY: 0 });
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
    <div
      ref={(el) => {
        (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        setRef(el);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "w-[360px] h-[220px] rounded-2xl",
        "bg-card-light dark:bg-card-dark",
        "border border-black/10 dark:border-white/10",
        "transition-all duration-100 ease-out",
        "hover:shadow-xl hover:shadow-accent/10",
        "group relative cursor-pointer",
        "transform-style-3d preserve-3d",
        className
      )}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg)`,
      }}
    >
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          "group-hover:opacity-50",
          "opacity-0"
        )}>
          <CanvasRevealEffect
            animationSpeed={3}
            opacities={[0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
            colors={[[203, 124, 91]]}
            dotSize={3}
            showGradient={false}
            containerClassName="h-full w-full bg-card-light dark:bg-card-dark"
          />
        </div>
      </div>

      <div className="relative z-10 p-4 h-full flex flex-col">
        <div className="flex items-start gap-3 mb-2">
          <img
            src={repo.ownerAvatar}
            alt={repo.ownerName}
            className="w-12 h-12 rounded-full border-2 border-accent/30 object-cover flex-shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:border-accent"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-lg text-left text-foreground truncate transition-colors duration-300 group-hover:text-accent"
              title={repo.name}
            >
              {repo.name}
            </h3>
            <p className="text-sm text-left text-default-500 truncate">{repo.ownerName}</p>
          </div>
        </div>

        <p
          className="text-sm text-left text-default-600 dark:text-default-600 line-clamp-3 mb-3 flex-shrink-0"
          title={repo.description}
        >
          {repo.description}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-default-600 dark:text-default-600">
              <Star
                className="text-accent"
                size={16}
                weight={isDark ? "regular" : (repo.stars > 0 ? "fill" : "regular")}
              />
              <span className="text-sm font-medium">{formatNumber(repo.stars)}</span>
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

          {repo.language && (
            <div className="flex items-center gap-1.5">
              {repo.languageColor && (
                <span
                  className={cn(
                    "w-3 h-3 rounded-full flex-shrink-0",
                    isDark ? "border-1.5" : undefined
                  )}
                  style={{
                    backgroundColor: isDark ? 'transparent' : repo.languageColor,
                    borderColor: isDark ? repo.languageColor : undefined
                  }}
                />
              )}
              <span className="text-sm text-default-600 dark:text-default-600 truncate max-w-[100px]">
                {repo.language}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
