'use client'

import { ReactNode } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { TopNavbar } from './TopNavbar'
import { Footer } from './Footer'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNavbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <Footer />
      </SidebarInset>
    </SidebarProvider>
  )
}
