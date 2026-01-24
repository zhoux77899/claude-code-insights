import type { ReactNode } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { ThemeSwitch } from "../common/ThemeSwitch";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title = "GitHub Repositories",
  subtitle = "Discover amazing open source projects",
}) => {
  return (
    <div className="min-h-screen bg-page-light dark:bg-page-dark transition-colors duration-300">
      <Navbar
        maxWidth="xl"
        position="sticky"
        className="bg-card-light/40 dark:bg-card-dark/40 backdrop-blur-md border-b border-black/10 dark:border-white/10 h-16"
      >
        <NavbarBrand className="gap-3 pl-4">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-accent"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-xl text-foreground">{title}</p>
            <p className="text-xs text-default-500 hidden sm:block">{subtitle}</p>
          </div>
        </NavbarBrand>

        <NavbarContent justify="end" className="gap-3 pr-4">
          <NavbarItem>
            <ThemeSwitch />
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-white/10 dark:border-white/5 py-6 mt-auto">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-default-500">
            Built with React, TypeScript & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
};
