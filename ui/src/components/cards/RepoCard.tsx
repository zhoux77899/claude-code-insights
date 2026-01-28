import React, { useState, useRef, useEffect, useCallback } from "react";
import { Star, GitFork } from "@phosphor-icons/react";
import type { FormattedRepo } from "../../types/github";
import { formatNumber } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import { CanvasRevealEffect } from "@/components/ui/canvasRevealEffect";
import { Card, CardHeader, CardBody, CardFooter, Image } from "@heroui/react";

interface RepoCardProps {
  repo: FormattedRepo;
  className?: string;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo, className }) => {
  const [, setMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ rotateX: 0, rotateY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isDark, setIsDark] = useState(true);

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
    setRotation({ rotateX: 0, rotateY: 0 });
    setMousePosition({ x: 0, y: 0 });
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
        isFooterBlurred={true}
        classNames={{
          base: "w-full h-full border-0 shadow-none bg-transparent",
          header: "border-0 shadow-none bg-transparent",
          body: "border-0 shadow-none bg-transparent py-2 pb-24",
          footer: "before:bg-accent/10 border-accent/20 border-1 overflow-hidden before:rounded-lg rounded-lg shadow-sm ml-2 bg-white/40 dark:bg-black/40",
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
            <p className="text-sm text-left text-default-500 truncate">{repo.ownerName}</p>
          </div>
        </CardHeader>

        <CardBody className="relative z-10 p-4 py-2">
          <p
            className="text-sm text-left text-default-600 dark:text-default-600 line-clamp-3"
            title={repo.description}
          >
            {repo.description}
          </p>
        </CardBody>

        <Image
          removeWrapper
          alt="Relaxing app background"
          className="z-100 w-full h-full"
          src="https://heroui.com/images/card-example-5.jpeg"
        />

        <CardFooter className="absolute bottom-2 p-2 w-[calc(100%_-_16px)] h-8 z-20 flex items-center justify-between backdrop-blur-sm">
          <div className="flex grow items-center gap-4">
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
        </CardFooter>
      </Card>
    </div>
  );
};
