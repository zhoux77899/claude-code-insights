import { useState, useMemo, useCallback, useRef } from "react";
import type { FormattedRepo } from "../types/github";

interface UseRepoSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  debouncedQuery: string;
  filteredRepos: FormattedRepo[];
  isSearching: boolean;
  hasResults: boolean;
  resultCount: number;
  clearSearch: () => void;
}

const DEBOUNCE_DELAY = 300;

function matchesSearchQuery(repo: FormattedRepo, query: string): boolean {
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return true;

  const searchableFields = [
    repo.name,
    repo.fullName,
    repo.ownerName,
    repo.description,
    repo.language,
    ...(repo.topics || []),
  ];

  return searchableFields.some((field) => {
    if (!field) return false;
    return field.toLowerCase().includes(lowerQuery);
  });
}

export function useRepoSearch(allRepos: FormattedRepo[]): UseRepoSearchReturn {
  const [searchQuery, setSearchQueryState] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
    setIsSearching(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, DEBOUNCE_DELAY);
  }, []);

  const filteredRepos = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return allRepos;
    }

    return allRepos.filter((repo) =>
      matchesSearchQuery(repo, debouncedQuery)
    );
  }, [allRepos, debouncedQuery]);

  const hasResults = filteredRepos.length > 0;
  const resultCount = filteredRepos.length;

  const clearSearch = useCallback(() => {
    setSearchQueryState("");
    setDebouncedQuery("");
    setIsSearching(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    filteredRepos,
    isSearching,
    hasResults,
    resultCount,
    clearSearch,
  };
}
