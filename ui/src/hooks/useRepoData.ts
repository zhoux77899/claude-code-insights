import { useState, useEffect, useCallback } from "react";
import type { FormattedRepo, RepositoriesResponse } from "../types/github";
import { safeFormatRepository } from "../utils/formatters";

interface UseRepoDataReturn {
  repos: FormattedRepo[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  validCount: number;
  skippedCount: number;
  loadMore: () => void;
  hasMore: boolean;
  refresh: () => void;
}

interface UseRepoDataProps {
  initialBatchSize?: number;
  batchSize?: number;
}

export function useRepoData({
  initialBatchSize = 40,
  batchSize = 20,
}: UseRepoDataProps = {}): UseRepoDataReturn {
  const [repos, setRepos] = useState<FormattedRepo[]>([]);
  const [allValidRepos, setAllValidRepos] = useState<FormattedRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [displayCount, setDisplayCount] = useState(initialBatchSize);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [skippedCount, setSkippedCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSkippedCount(0);

      let response: Response;
      const remoteUrl = "https://raw.githubusercontent.com/zhoux77899/claude-code-insights/refs/heads/main/plugins/repos.json";
      const localUrl = "/data/plugins-repos.json";

      try {
        response = await fetch(remoteUrl);
        if (!response.ok) {
          throw new Error(`Remote fetch failed: ${response.status}`);
        }
      } catch (remoteError) {
        console.log("[useRepoData] Remote fetch failed, falling back to local data");
        response = await fetch(localUrl);
        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.status}`);
        }
      }

      const data: RepositoriesResponse = await response.json();

      const reposMap = new Map<number, FormattedRepo>();
      const seenIds = new Set<number>();
      let skipped = 0;

      for (const item of data.items) {
        if (seenIds.has(item.id)) {
          skipped++;
          continue;
        }

        const formatted = safeFormatRepository(item);
        if (formatted !== null) {
          reposMap.set(item.id, formatted);
          seenIds.add(item.id);
        } else {
          skipped++;
        }
      }

      const validRepos = Array.from(reposMap.values());

      setSkippedCount(skipped);
      setAllValidRepos(validRepos);
      setRepos(validRepos.slice(0, initialBatchSize));
      setDisplayCount(initialBatchSize);
      setHasLoaded(true);

      if (skipped > 0) {
        console.log(`[useRepoData] Loaded ${validRepos.length} valid repositories, skipped ${skipped} invalid records`);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setLoading(false);
    }
  }, [initialBatchSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadMore = useCallback(() => {
    if (displayCount >= allValidRepos.length) return;

    const nextCount = Math.min(displayCount + batchSize, allValidRepos.length);
    setRepos(allValidRepos.slice(0, nextCount));
    setDisplayCount(nextCount);
  }, [displayCount, allValidRepos.length, batchSize]);

  const hasMore = displayCount < allValidRepos.length;

  const refresh = useCallback(() => {
    setHasLoaded(false);
    setRepos([]);
    setAllValidRepos([]);
    setSkippedCount(0);
    loadData();
  }, [loadData]);

  return {
    repos,
    loading: loading && !hasLoaded,
    error,
    totalCount: allValidRepos.length,
    validCount: allValidRepos.length,
    skippedCount,
    loadMore,
    hasMore,
    refresh,
  };
}
