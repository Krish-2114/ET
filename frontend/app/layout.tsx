import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/ui/Sidebar'
import Disclaimer from '@/components/ui/Disclaimer'

export const metadata: Metadata = {
  title: 'AI Money Mentor',
  description: 'Your AI-powered personal finance guide for India',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', maxHeight: '100vh' }}>
            {children}
            <Disclaimer />
          </main>
        </div>
      </body>
    </html>
  )
}
