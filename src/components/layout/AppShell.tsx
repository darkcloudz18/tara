'use client'

import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

interface AppShellProps {
  user: any
  children: React.ReactNode
}

// Persistent app frame: desktop sidebar on the left, mobile bottom tabs
// pinned to the bottom. Content sits between them with lg:ml-[260px] to
// clear the sidebar and pb-16 to clear the mobile bar. Use on every app
// route the user can navigate to; skip on /login, /register,
// /forgot-password, /reset-password, /admin (owns its own shell),
// /offline, and error boundaries.
export default function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Sidebar user={user} />
      <div className="lg:ml-[260px] pb-16 lg:pb-0">{children}</div>
      <MobileNav user={user} />
    </div>
  )
}
