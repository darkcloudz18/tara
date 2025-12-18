import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tara - Travel Together, Book Better',
  description: 'All-in-one travel platform for the Philippines. Plan trips, discover content, and book with confidence.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
