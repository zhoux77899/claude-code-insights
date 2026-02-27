export interface GitHubOwner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
}

export interface GitHubLicense {
  key: string;
  name: string;
  spdx_id: string;
  url: string;
  node_id: string;
}

export interface GitHubRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubOwner;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  license: GitHubLicense | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  archived: boolean;
  disabled: boolean;
  mirror_url: string | null;
  topics: string[];
  default_branch: string;
}

export interface RepositoriesResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

export interface FormattedRepo {
  id: number;
  name: string;
  fullName: string;
  ownerName: string;
  ownerAvatar: string;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  issues: number;
  size: number;
  language: string | null;
  languageColor: string | null;
  url: string;
  homepage: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  license: string | null;
  topics: string[];
  defaultBranch: string;
  plugins?: number;
  pluginDescription?: string;
  pluginVersion?: string;
}

export interface MarketplacePlugin {
  name: string;
  description?: string;
  version?: string;
}

export interface MarketplaceMetadata {
  description?: string;
  version?: string;
}

export interface MarketplaceData {
  plugins?: MarketplacePlugin[];
  metadata?: MarketplaceMetadata;
  description?: string;
  version?: string;
}

export type SortOption = "stars" | "forks" | "trending";

export interface SortConfig {
  option: SortOption;
  direction: "desc";
}

export interface StarsHistoryData {
  date: string;
  stars: number;
}
