import { LANGUAGE_COLORS } from "./constants";
import type { FormattedRepo, GitHubRepository } from "../types/github";

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function formatNumberWithCommas(num: number): string {
  return num.toLocaleString('en-US');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return bytes + " KB";
  }
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return diffMinutes <= 1 ? "just now" : `${diffMinutes} minutes ago`;
    }
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  if (diffDays === 1) {
    return "yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  const years = Math.floor(diffDays / 365);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

export function getLanguageColor(language: string | null): string | null {
  if (!language) return "#8b8b8b";
  return LANGUAGE_COLORS[language] || "#8b8b8b";
}

export function isValidRepository(repo: any): repo is GitHubRepository {
  if (!repo || typeof repo !== "object") {
    return false;
  }

  if (typeof repo.id !== "number" || !repo.id) {
    return false;
  }

  if (typeof repo.name !== "string" || !repo.name) {
    return false;
  }

  if (!repo.owner || typeof repo.owner !== "object") {
    return false;
  }

  if (typeof repo.owner.login !== "string" || !repo.owner.login) {
    return false;
  }

  if (typeof repo.html_url !== "string" || !repo.html_url) {
    return false;
  }

  return true;
}

export function formatRepository(repo: GitHubRepository): FormattedRepo {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    ownerName: repo.owner.login,
    ownerAvatar: repo.owner.avatar_url,
    description: repo.description || "No description available",
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.watchers_count,
    issues: repo.open_issues_count,
    size: repo.size,
    language: repo.language,
    languageColor: getLanguageColor(repo.language),
    url: repo.html_url,
    homepage: repo.homepage,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
    license: repo.license?.spdx_id || null,
    topics: repo.topics || [],
    defaultBranch: repo.default_branch || "main",
  };
}

export function safeFormatRepository(repo: any): FormattedRepo | null {
  if (!isValidRepository(repo)) {
    console.warn(`[RepoFormatter] Invalid repository data skipped:`, {
      id: repo?.id,
      name: repo?.name,
      hasOwner: !!repo?.owner,
      ownerLogin: repo?.owner?.login,
    });
    return null;
  }

  try {
    return formatRepository(repo);
  } catch (error) {
    console.error(`[RepoFormatter] Error formatting repository ${repo.id}:`, error);
    return null;
  }
}

export function getThemeColors() {
  return {
    accent: "#CB7C5B",
    pageDark: "#09090B",
    pageLight: "#FDFDF7",
    cardDark: "#1D1917",
    cardLight: "#FFFFFF",
  };
}
