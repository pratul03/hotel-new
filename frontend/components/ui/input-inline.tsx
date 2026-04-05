"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InputInlineProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  buttonText?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
}

export function InputInline({
  value,
  defaultValue = "",
  placeholder = "Search...",
  buttonText = "Search",
  disabled = false,
  className,
  onChange,
  onSearch,
}: InputInlineProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const query = useMemo(() => value ?? internalValue, [value, internalValue]);

  const handleChange = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  const handleSearch = () => {
    onSearch?.(query);
  };

  return (
    <Field orientation="horizontal" className={cn("w-full", className)}>
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
      />
      <Button type="button" disabled={disabled} onClick={handleSearch}>
        {buttonText}
      </Button>
    </Field>
  );
}
