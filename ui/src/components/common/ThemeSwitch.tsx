import React from "react";
import { Button } from "@heroui/react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "../../hooks/useTheme";

export const ThemeSwitch: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      isIconOnly
      variant="flat"
      size="md"
      onPress={toggleTheme}
      className="rounded-lg border-1.5 border-accent bg-white/40 dark:bg-black/40 hover:bg-accent/10 text-foreground flex items-center justify-center"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
    >
      {theme === "dark" ? (
        <Sun className="text-accent" size={20} weight="regular" />
      ) : (
        <Moon className="text-accent" size={20} weight="regular" />
      )}
    </Button>
  );
};
