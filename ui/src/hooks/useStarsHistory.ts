interface StarsHistoryData {
  date: string;
  stars: number;
}

export async function getStarsHistory(repoFullName: string): Promise<StarsHistoryData[]> {
  try {
    let response: Response;
    const remoteUrl = "https://raw.githubusercontent.com/zhoux77899/claude-code-insights/refs/heads/main/plugins/history.json";
    const localUrl = "/data/plugins-history.json";

    try {
      response = await fetch(remoteUrl);
      if (!response.ok) {
        throw new Error(`Remote fetch failed: ${response.status}`);
      }
    } catch (remoteError) {
      console.log("[getStarsHistory] Remote fetch failed, falling back to local data");
      response = await fetch(localUrl);
      if (!response.ok) {
        return [];
      }
    }

    const data = await response.json();

    if (!data || !data[repoFullName]) {
      return [];
    }

    const repoData = data[repoFullName];
    const dates = Object.keys(repoData).sort().slice(-30);

    return dates.map((date: string) => ({
      date,
      stars: repoData[date]?.stargazers_count || 0,
    }));
  } catch (error) {
    console.error(`Failed to load stars history for ${repoFullName}:`, error);
    return [];
  }
}
