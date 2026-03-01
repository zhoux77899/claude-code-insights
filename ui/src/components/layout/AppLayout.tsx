import type { ReactNode } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { Claude } from '@lobehub/icons';
import { ThemeSwitch } from "../common/ThemeSwitch";
import { RepoSortSelect } from "../common/RepoSortSelect";
import { RepoSearchInput } from "../common/RepoSearchInput";
import { GithubLinkButton } from "../common/GithubLinkButton";
import type { SortOption } from "../../types/github";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  sortOption?: SortOption;
  onSortChange?: (option: SortOption) => void;
  isSortLoading?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isSearching?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title = "Claude Code Insights",
  subtitle = "Discover amazing Claude Code plugins repositories",
  sortOption,
  onSortChange,
  isSortLoading = false,
  searchQuery,
  onSearchChange,
  isSearching = false,
}) => {
  return (
    <div className="min-h-screen bg-page-light dark:bg-page-dark transition-colors duration-300">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar
          maxWidth="xl"
          position="static"
          className="bg-card-light/50 dark:bg-card-dark/50 backdrop-blur-md border-b border-black/10 dark:border-white/10 h-16"
        >
          <NavbarBrand className="gap-2 pl-4 items-bottom">
            <div className="flex items-center justify-center flex-shrink-0 gap-2">
              <Claude.Color size={20} />
              <p className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-accent to-[#E8A085] dark:to-[#9A5B4A]">{title}</p>
            </div>
            <div className="flex flex-row items-center">
              <p className="text-sm text-foreground hidden sm:block ml-2">{subtitle}</p>
            </div>
          </NavbarBrand>

          <NavbarContent justify="end" className="gap-3 pr-4">
            {searchQuery !== undefined && onSearchChange && (
              <NavbarItem className="hidden md:flex">
                <RepoSearchInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  isSearching={isSearching}
                />
              </NavbarItem>
            )}
            {sortOption && onSortChange && (
              <NavbarItem className="hidden sm:flex">
                <RepoSortSelect
                  value={sortOption}
                  onChange={onSortChange}
                  isLoading={isSortLoading}
                />
              </NavbarItem>
            )}
            <NavbarItem>
              <GithubLinkButton />
            </NavbarItem>
            <NavbarItem>
              <ThemeSwitch />
            </NavbarItem>
          </NavbarContent>
        </Navbar>
      </div>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
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
