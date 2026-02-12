import { useState, useEffect, useCallback, useMemo } from "react";
import type { FormattedRepo, SortOption } from "../types/github";

const STORAGE_KEY = "repo-sort-option";

interface UseRepoSortReturn {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  sortedRepos: FormattedRepo[];
  isSorting: boolean;
  trendingScores: Map<string, number>;
}

interface HistoryData {
  [repoFullName: string]: {
    [date: string]: {
      stargazers_count: number;
    };
  };
}

async function fetchStarsHistoryData(): Promise<HistoryData> {
  try {
    const remoteUrl = "https://raw.githubusercontent.com/zhoux77899/claude-code-insights/refs/heads/main/plugins/history.json";
    const localUrl = "/data/plugins-history.json";

    let response: Response;
    try {
      response = await fetch(remoteUrl);
      if (!response.ok) {
        throw new Error(`Remote fetch failed: ${response.status}`);
      }
    } catch {
      response = await fetch(localUrl);
      if (!response.ok) {
        return {};
      }
    }

    return await response.json();
  } catch (error) {
    console.error("[useRepoSort] Failed to load stars history:", error);
    return {};
  }
}

function calculateTrendingScore(
  repoFullName: string,
  historyData: HistoryData
): number {
  const repoData = historyData[repoFullName];
  if (!repoData) return 0;

  const dates = Object.keys(repoData).sort();
  if (dates.length < 2) return 0;

  const latestDate = dates[dates.length - 1];
  const previousDate = dates[dates.length - 2];

  const latestStars = repoData[latestDate]?.stargazers_count || 0;
  const previousStars = repoData[previousDate]?.stargazers_count || 0;

  return latestStars - previousStars;
}

function sortRepos(
  repos: FormattedRepo[],
  sortOption: SortOption,
  trendingScores: Map<string, number>
): FormattedRepo[] {
  const sorted = [...repos];

  switch (sortOption) {
    case "stars":
      return sorted.sort((a, b) => b.stars - a.stars);
    case "forks":
      return sorted.sort((a, b) => b.forks - a.forks);
    case "trending":
      return sorted.sort((a, b) => {
        const scoreA = trendingScores.get(a.fullName) || 0;
        const scoreB = trendingScores.get(b.fullName) || 0;
        return scoreB - scoreA;
      });
    default:
      return sorted;
  }
}

export function useRepoSort(allRepos: FormattedRepo[]): UseRepoSortReturn {
  const [sortOption, setSortOptionState] = useState<SortOption>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ["stars", "forks", "trending"].includes(stored)) {
        return stored as SortOption;
      }
    }
    return "stars";
  });

  const [historyData, setHistoryData] = useState<HistoryData>({});
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const data = await fetchStarsHistoryData();
        if (isMounted) {
          setHistoryData(data);
        }
      } finally {
        if (isMounted) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const setSortOption = useCallback((option: SortOption) => {
    setSortOptionState(option);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, option);
    }
  }, []);

  const trendingScores = useMemo(() => {
    const scores = new Map<string, number>();
    if (Object.keys(historyData).length > 0) {
      allRepos.forEach((repo) => {
        const score = calculateTrendingScore(repo.fullName, historyData);
        scores.set(repo.fullName, score);
      });
    }
    return scores;
  }, [allRepos, historyData]);

  const sortedRepos = useMemo(() => {
    return sortRepos(allRepos, sortOption, trendingScores);
  }, [allRepos, sortOption, trendingScores]);

  const isSorting = sortOption === "trending" && isLoadingHistory;

  return {
    sortOption,
    setSortOption,
    sortedRepos,
    isSorting,
    trendingScores,
  };
}
