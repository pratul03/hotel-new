'use client'

import { Spinner } from '@/components/ui/spinner'

interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Spinner />
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
