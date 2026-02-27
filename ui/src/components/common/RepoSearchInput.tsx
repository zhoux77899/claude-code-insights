import React, { useCallback } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

interface RepoSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  placeholder?: string;
}

export const RepoSearchInput: React.FC<RepoSearchInputProps> = ({
  value,
  onChange,
  isSearching = false,
  placeholder = "Search Repos...",
}) => {
  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const showClearButton = value && value.length > 0;

  return (
    <div className="flex items-center w-[200px] bg-white/40 dark:bg-black/40 border-[1.5px] border-accent rounded-lg h-[40px] px-3.5 gap-2">
      <div className="flex items-center justify-center flex-shrink-0">
        <MagnifyingGlass
          size={16}
          className="text-accent"
          weight="regular"
        />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-foreground text-sm placeholder:text-default-400 outline-none min-w-0"
        aria-label="Search repositories"
      />
      {isSearching ? (
        <div className="flex items-center justify-center flex-shrink-0">
          <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : showClearButton ? (
        <button
          onClick={handleClear}
          className="flex items-center justify-center flex-shrink-0 w-5 h-5 rounded-full hover:bg-accent/10 text-accent transition-colors"
          type="button"
          aria-label="Clear search"
        >
          <X size={12} className="text-accent" weight="bold" />
        </button>
      ) : null}
    </div>
  );
};
