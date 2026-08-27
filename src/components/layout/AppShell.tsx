'use client'

import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

interface AppShellProps {
  children: React.ReactNode
}

// Persistent app frame: desktop sidebar on the left, mobile bottom tabs
// pinned to the bottom. Sidebar and MobileNav read user state from
// UserContext directly — callers no longer pass a user prop. Skip on
// /login, /register, /forgot-password, /reset-password, /admin (owns
// its own shell), /offline, and error boundaries.
export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Sidebar />
      <div className="lg:ml-[260px] pb-16 lg:pb-0">{children}</div>
      <MobileNav />
    </div>
  )
}
