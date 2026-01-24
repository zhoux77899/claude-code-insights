import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isBrowser = typeof window !== "undefined";

export const getSystemTheme = (): "dark" | "light" => {
  if (!isBrowser) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const getStoredTheme = (): "dark" | "light" | null => {
  if (!isBrowser) return null;
  return localStorage.getItem("theme") as "dark" | "light" | null;
};

export const storeTheme = (theme: "dark" | "light"): void => {
  if (!isBrowser) return;
  localStorage.setItem("theme", theme);
};
