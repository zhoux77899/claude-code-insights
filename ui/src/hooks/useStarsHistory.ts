interface StarsHistoryData {
  date: string;
  stars: number;
}

export async function getStarsHistory(repoFullName: string): Promise<StarsHistoryData[]> {
  try {
    const response = await fetch("/data/plugins-history.json");

    if (!response.ok) {
      return [];
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
