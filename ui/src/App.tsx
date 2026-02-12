import React, { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { Button } from "@heroui/react";
import { ArrowDown, GithubLogo } from "@phosphor-icons/react";
import { AppLayout } from "./components/layout";
import { RepoCard, ModalProvider } from "./components/cards";
import { LoadingSpinner, ErrorBoundary, RepoSortSelect } from "./components/common";
import { useRepoData, useRepoSort } from "./hooks";
import { cn } from "./utils/cn";

const INITIAL_BATCH_SIZE = 40;
const BATCH_SIZE = 20;

const App: React.FC = () => {
  const { allRepos, loading, error, totalCount } = useRepoData();
  const { sortOption, setSortOption, sortedRepos, isSorting, trendingScores } = useRepoSort(allRepos);

  const [displayCount, setDisplayCount] = useState(INITIAL_BATCH_SIZE);

  const displayRepos = useMemo(() => {
    return sortedRepos.slice(0, displayCount);
  }, [sortedRepos, displayCount]);

  const hasMore = displayCount < sortedRepos.length;

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (displayCount >= sortedRepos.length) return;
    const nextCount = Math.min(displayCount + BATCH_SIZE, sortedRepos.length);
    setDisplayCount(nextCount);
  }, [displayCount, sortedRepos.length]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "200px",
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  if (error) {
    return (
      <AppLayout
        sortOption={sortOption}
        onSortChange={setSortOption}
        isSortLoading={isSorting}
      >
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <GithubLogo className="text-accent mb-4" size={64} />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Unable to Load Repositories
            </h2>
            <p className="text-default-500 mb-4">{error.message}</p>
            <Button
              color="primary"
              variant="flat"
              onPress={() => window.location.reload()}
              className="bg-accent/10 text-accent hover:bg-accent/20"
            >
              Try Again
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <ModalProvider>
      <AppLayout
        title="GitHub Repositories"
        subtitle={`${totalCount.toLocaleString()} amazing open source projects`}
        sortOption={sortOption}
        onSortChange={setSortOption}
        isSortLoading={isSorting}
      >
        <ErrorBoundary
          fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-default-500">Something went wrong displaying repositories.</p>
            </div>
          }
        >
          {/* Mobile Sort Select */}
          <div className="flex sm:hidden justify-end mb-4 px-4">
            <RepoSortSelect
              value={sortOption}
              onChange={setSortOption}
              isLoading={isSorting}
            />
          </div>

          {loading ? (
            <LoadingSpinner fullScreen />
          ) : (
            <>
              <div
                className={cn(
                  "flex flex-wrap justify-center gap-x-4 gap-y-4",
                  "w-full mx-auto max-w-[1920px]"
                )}
              >
                {displayRepos.map((repo) => (
                  <RepoCard
                    key={repo.id}
                    repo={repo}
                    sortOption={sortOption}
                    trendingScores={trendingScores}
                  />
                ))}
              </div>

              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="flex justify-center py-12"
                >
                  <Button
                    variant="flat"
                    color="primary"
                    onPress={loadMore}
                    isLoading={loading}
                    endContent={<ArrowDown className={cn("transition-transform", loading ? "animate-bounce" : "")} />}
                    className="bg-accent/10 text-accent hover:bg-accent/20 min-w-[160px]"
                  >
                    Load More
                  </Button>
                </div>
              )}

              {!hasMore && displayRepos.length > 0 && (
                <div className="flex justify-center py-8">
                  <p className="text-default-500 text-sm">
                    You've reached the end • {totalCount.toLocaleString()} repositories
                  </p>
                </div>
              )}
            </>
          )}
        </ErrorBoundary>
      </AppLayout>
    </ModalProvider>
  ); 
};

export default App;
