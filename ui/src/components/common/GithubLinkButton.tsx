import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { GithubLogo } from "@phosphor-icons/react";

interface GithubLinkButtonProps {
  href?: string;
}

export const GithubLinkButton: React.FC<GithubLinkButtonProps> = ({
  href = "https://github.com/zhoux77899/claude-code-insights",
}) => {
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
        attributeFilter: ["class"],
      });
  
      return () => observer.disconnect();
    }, []);
  
    const iconWeight = isDark ? "regular" : "fill";

  return (
    <Button
      isIconOnly
      variant="flat"
      size="md"
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border-1.5 border-accent bg-white/40 dark:bg-black/40 hover:bg-accent/10 text-foreground flex items-center justify-center"
      aria-label="View source on GitHub"
    >
      <GithubLogo className="text-accent" size={20} weight={iconWeight} />
    </Button>
  );
};
