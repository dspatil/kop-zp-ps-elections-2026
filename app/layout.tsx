import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kolhapur ZP & PS Elections 2026 - Reservation Details',
  description: 'Official reservation details for Zilla Parishad and Panchayat Samiti elections in Kolhapur district, Maharashtra. Check seat reservations, election schedule, and eligibility.',
  keywords: 'Kolhapur, ZP, Panchayat Samiti, Election, Reservation, 2026, Maharashtra',
  openGraph: {
    title: 'Kolhapur ZP & PS Elections 2026',
    description: 'Official reservation details for Kolhapur district elections',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

