interface StarsHistoryData {
  date: string;
  stars: number | null;
}

interface RepoHistoryData {
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
}

type IntervalType = 'day' | 'week' | 'month';

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function getDaysDifference(date1: Date, date2: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((date2.getTime() - date1.getTime()) / msPerDay);
}

function detectInterval(dates: string[]): IntervalType {
  if (dates.length < 2) {
    return 'day';
  }

  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const prevDate = parseDate(dates[i - 1]);
    const currDate = parseDate(dates[i]);
    const diff = getDaysDifference(prevDate, currDate);
    intervals.push(diff);
  }

  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

  if (avgInterval >= 25 && avgInterval <= 35) {
    return 'month';
  } else if (avgInterval >= 5 && avgInterval <= 9) {
    return 'week';
  } else {
    return 'day';
  }
}

function addInterval(date: Date, interval: IntervalType): Date {
  const newDate = new Date(date);
  switch (interval) {
    case 'day':
      newDate.setUTCDate(newDate.getUTCDate() + 1);
      break;
    case 'week':
      newDate.setUTCDate(newDate.getUTCDate() + 7);
      break;
    case 'month':
      newDate.setUTCMonth(newDate.getUTCMonth() + 1);
      break;
  }
  return newDate;
}

function fillMissingDates(
  repoData: Record<string, RepoHistoryData>,
  maxPoints: number = 30
): StarsHistoryData[] {
  const dates = Object.keys(repoData).sort();
  if (dates.length === 0) return [];

  if (dates.length === 1) {
    const date = dates[0];
    return [{
      date,
      stars: repoData[date]?.stargazers_count ?? null,
    }];
  }

  const interval = detectInterval(dates);
  const startDate = parseDate(dates[0]);
  const endDate = parseDate(dates[dates.length - 1]);

  const result: StarsHistoryData[] = [];

  for (let d = new Date(startDate); d <= endDate; d = addInterval(d, interval)) {
    const dateStr = formatDate(d);
    const existingData = repoData[dateStr];

    result.push({
      date: dateStr,
      stars: existingData?.stargazers_count ?? null,
    });
  }

  return result.slice(-maxPoints);
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
    } catch {
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

    return fillMissingDates(repoData, 30);
  } catch (error) {
    console.error(`Failed to load stars history for ${repoFullName}:`, error);
    return [];
  }
}
