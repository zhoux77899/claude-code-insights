import { useState, useEffect, useCallback } from "react";
import type { MarketplaceData } from "../types/github";

export interface PluginData {
  plugins: number;
  pluginDescriptions: string[];
  pluginVersions: string[];
  pluginNames: string[];
}

export async function getMarketplaceData(
  fullName: string,
  defaultBranch: string
): Promise<PluginData | null> {
  try {
    const url = `https://raw.githubusercontent.com/${fullName}/${defaultBranch}/.claude-plugin/marketplace.json`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data: MarketplaceData = await response.json();

    const plugins = data.plugins?.length || 0;

    const pluginDescriptions: string[] = [];
    const pluginVersions: string[] = [];
    const pluginNames: string[] = [];

    if (data.plugins && data.plugins.length > 0) {
      for (const plugin of data.plugins) {
        pluginNames.push(plugin.name);
        pluginDescriptions.push(plugin.description || data.metadata?.description || data.description || "");
        pluginVersions.push(plugin.version || data.metadata?.version || data.version || "");
      }
    }

    return {
      plugins,
      pluginDescriptions,
      pluginVersions,
      pluginNames,
    };
  } catch (error) {
    console.error(`Failed to load marketplace data for ${fullName}:`, error);
    return null;
  }
}

export function usePluginData(fullName: string, defaultBranch: string) {
  const [pluginData, setPluginData] = useState<PluginData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadPluginData = useCallback(async () => {
    if (!fullName || !defaultBranch) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getMarketplaceData(fullName, defaultBranch);
      setPluginData(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setLoading(false);
    }
  }, [fullName, defaultBranch]);

  useEffect(() => {
    loadPluginData();
  }, [loadPluginData]);

  return {
    pluginData,
    loading,
    error,
    refresh: loadPluginData,
  };
}
