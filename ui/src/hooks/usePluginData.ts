import { useState, useEffect, useCallback } from "react";
import type { MarketplaceData } from "../types/github";

export interface PluginData {
  plugins: number;
  pluginDescription?: string;
  pluginVersion?: string;
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

    let pluginDescription: string | undefined;
    let pluginVersion: string | undefined;

    if (data.plugins && data.plugins.length > 0) {
      pluginDescription = data.plugins[0].description;
      pluginVersion = data.plugins[0].version;
    }

    if (!pluginDescription && data.metadata?.description) {
      pluginDescription = data.metadata.description;
    }
    if (!pluginDescription && data.description) {
      pluginDescription = data.description;
    }

    if (!pluginVersion && data.metadata?.version) {
      pluginVersion = data.metadata.version;
    }
    if (!pluginVersion && data.version) {
      pluginVersion = data.version;
    }

    return {
      plugins,
      pluginDescription,
      pluginVersion,
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
