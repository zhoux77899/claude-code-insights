import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { safeFormatRepository } from "../utils/formatters";
import { useRepoData } from "./useRepoData";
import { useRepoSort } from "./useRepoSort";
import { getStarsHistory } from "./useStarsHistory";

const pagesBase = "/claude-code-insights/";
const rawBase = "https://raw.githubusercontent.com/zhoux77899/claude-code-insights/refs/heads/main/plugins/";
const repoItem = {
  id: 1,
  name: "plugin",
  full_name: "example/plugin",
  owner: { login: "example" },
  html_url: "https://github.com/example/plugin",
};
const history = {
  [repoItem.full_name]: {
    "2026-11-20": { stargazers_count: 2 },
    "2026-11-21": { stargazers_count: 5 },
  },
};

function mockFallback(fileName: string, data: object) {
  const fallbackUrl = `${pagesBase}data/plugins-${fileName}`;
  const fetchMock = vi.fn(async (url: string) => {
    if (url === `${rawBase}${fileName}`) {
      return new Response(null, { status: 503 });
    }
    if (url === fallbackUrl) {
      return Response.json(data);
    }
    return new Response(null, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("GitHub Pages data fallback", () => {
  beforeEach(() => {
    vi.stubEnv("BASE_URL", pagesBase);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("loads the repository list under the Pages base path", async () => {
    const fetchMock = mockFallback("repos.json", { items: [repoItem] });
    const { result } = renderHook(useRepoData);

    await waitFor(() => expect(result.current.allRepos[0]?.fullName).toBe(repoItem.full_name));
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${rawBase}repos.json`);
  });

  it("loads bundled history for trending scores", async () => {
    mockFallback("history.json", history);
    const repo = safeFormatRepository(repoItem);
    if (!repo) throw new Error("Invalid repository fixture");
    const repos = [repo];
    const { result } = renderHook(() => useRepoSort(repos));

    await waitFor(() => expect(result.current.trendingScores.get(repoItem.full_name)).toBe(3));
  });

  it("loads bundled history for the repository chart", async () => {
    mockFallback("history.json", history);

    await expect(getStarsHistory(repoItem.full_name)).resolves.toEqual([
      { date: "2026-11-20", stars: 2 },
      { date: "2026-11-21", stars: 5 },
    ]);
  });
});
