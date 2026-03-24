'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Search } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useMemo } from 'react'

interface DataTableToolbarProps {
  searchPlaceholder?: string
  searchValue: string
  onSearch: (query: string) => void
  addLabel?: string
  onAdd?: () => void
}

export function DataTableToolbar({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearch,
  addLabel,
  onAdd,
}: DataTableToolbarProps) {
  const [query, setQuery] = useState(searchValue)

  const debouncedSearch = useCallback(
    debounce((q: string) => {
      onSearch(q)
    }, 300),
    [onSearch]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  return (
    <div className="flex gap-4 items-center">
      <div className="flex-1 relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={query}
          onChange={handleChange}
          className="pl-8"
        />
      </div>
      {onAdd && addLabel && (
        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
