import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { CopySimple, Check } from "@phosphor-icons/react";
import { cn } from "../../utils/cn";

export interface PluginCardProps {
  pluginName: string;
  pluginVersion: string;
  pluginDescription: string;
  repoName: string;
  isDark?: boolean;
}

export const PluginCard: React.FC<PluginCardProps> = ({
  pluginName,
  pluginVersion,
  pluginDescription,
  repoName,
  isDark = true,
}) => {
  const [copied, setCopied] = useState(false);
  const installCommand = `/plugin install ${pluginName}@${repoName}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Card
      classNames={{
        base: cn(
          "w-full h-[140px] rounded-xl",
          "bg-card-light/50 dark:bg-card-dark/50",
          "border border-black/10 dark:border-white/10",
          "transition-all duration-200"
        ),
        header: "pb-2",
        body: "pt-0",
      }}
    >
      <CardHeader className="flex flex-col items-start p-4">
        <span className="text-accent font-medium">
          {pluginName}@{pluginVersion}
        </span>
      </CardHeader>

      <CardBody className="flex flex-col relative gap-2 p-4 h-[84px]">
        <p
          className={cn(
            "text-sm text-default-600 dark:text-default-400",
            "line-clamp-2",
          )}
        >
          {pluginDescription || "No description available"}
        </p>

        <div
          className={cn(
            "flex w-full mt-auto items-center justify-between",
            "rounded-md px-1",
            "bg-page-light/50 dark:bg-page-dark/50 backdrop-blur-xs",
            "border border-1.5 border-black/10 dark:border-white/10"
          )}
        >
          <span className="text-xs font-maple-mono text-default-600 dark:text-default-600 truncate">
            {installCommand}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 rounded-md text-default-500 hover:text-accent transition-colors duration-200"
            aria-label="Copy command"
          >
            {copied ? (
              <Check size={12} weight="bold" className="text-success" />
            ) : (
              <CopySimple size={12} weight={isDark ? "regular" : "bold"} />
            )}
          </button>
        </div>
      </CardBody>
    </Card>
  );
};
