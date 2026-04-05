"use client";

import { Button } from "@/components/ui/button";
import { InputInline } from "@/components/ui/input-inline";
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

interface DataTableToolbarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearch: (query: string) => void;
  addLabel?: string;
  onAdd?: () => void;
}

export function DataTableToolbar({
  searchPlaceholder = "Search...",
  searchValue,
  onSearch,
  addLabel,
  onAdd,
}: DataTableToolbarProps) {
  const [query, setQuery] = useState(searchValue);

  const debouncedSearch = useCallback(
    debounce((q: string) => {
      onSearch(q);
    }, 300),
    [onSearch],
  );

  const handleChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div className="flex gap-4 items-center">
      <InputInline
        className="flex-1"
        placeholder={searchPlaceholder}
        value={query}
        onChange={handleChange}
        onSearch={onSearch}
      />
      {onAdd && addLabel && (
        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      )}
    </div>
  );
}

function debounce(
  func: (query: string) => void,
  wait: number,
): (query: string) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(query: string) {
    const later = () => {
      clearTimeout(timeout);
      func(query);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
