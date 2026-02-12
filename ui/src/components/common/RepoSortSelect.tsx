import React from "react";
import { Select, SelectItem, type Selection } from "@heroui/react";
import { Star, GitFork, TrendUp, CaretDown } from "@phosphor-icons/react";
import type { SortOption } from "../../types/github";
import { cn } from "@/utils/cn";

interface RepoSortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  isLoading?: boolean;
}

const sortOptions: { key: SortOption; label: string; icon: React.ReactNode }[] = [
  {
    key: "stars",
    label: "Stars",
    icon: <Star size={16} weight="fill" />,
  },
  {
    key: "forks",
    label: "Forks",
    icon: <GitFork size={16} weight="fill" />,
  },
  {
    key: "trending",
    label: "Trending (24H)",
    icon: <TrendUp size={16} weight="fill" />,
  },
];

export const RepoSortSelect: React.FC<RepoSortSelectProps> = ({
  value,
  onChange,
  isLoading = false,
}) => {
  const handleSelectionChange = (keys: Selection) => {
    const selectedKey = Array.from(keys)[0] as SortOption;
    if (selectedKey && selectedKey !== value) {
      onChange(selectedKey);
    }
  };

  const selectedOption = sortOptions.find((opt) => opt.key === value);

  return (
    <Select
      selectedKeys={[value]}
      onSelectionChange={handleSelectionChange}
      size="sm"
      variant="flat"
      radius="lg"
      className="flex items-center justify-between w-[200px]"
      classNames={{
        trigger:
          "flex items-center justify-between bg-white/40 dark:bg-black/40 border-1.5 border-accent rounded-lg h-[40px] min-h-[40px] px-3.5",
        innerWrapper: "flex flex-1 flex-row items-center justify-between gap-4",
        value: "flex flex-1 text-foreground text-sm font-medium",
        selectorIcon: "hidden",
        popoverContent:
          "bg-card-light dark:bg-card-dark border border-black/10 dark:border-white/10 rounded-lg shadow-lg",
        listbox: "bg-transparent",
      }}
      startContent={
        <span className="text-accent flex-shrink-0">
          {selectedOption?.icon}
        </span>
      }
      endContent={
        <span className="text-accent flex-shrink-0">
          <CaretDown size={16} weight="bold" />
        </span>
      }
      isLoading={isLoading}
      aria-label="Sort repositories"
      placeholder="Sort by"
    >
      {sortOptions.map((option) => (
        <SelectItem
          key={option.key}
          textValue={option.label}
          className={cn(
            "flex items-center justify-start p-2 gap-3 h-10",
            "rounded-md",
            "hover:bg-accent/10",
            "text-foreground hover:text-accent data-[selected=true]:text-accent",
          )}
          startContent={
            <span className="flex items-center justify-center text-accent w-5 h-5">
              {option.icon}
            </span>
          }
        >
          <span className="flex items-center text-sm leading-none">{option.label}</span>
        </SelectItem>
      ))}
    </Select>
  );
};
