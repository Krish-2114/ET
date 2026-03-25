'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard',     icon: '🏠', label: 'Dashboard' },
  { href: '/money-health',  icon: '❤️', label: 'Money Health' },
  { href: '/fire-planner',  icon: '🔥', label: 'FIRE Planner' },
  { href: '/tax-wizard',    icon: '🧮', label: 'Tax Wizard' },
  { href: '/portfolio',     icon: '📊', label: 'Portfolio X-Ray' },
  { href: '/couple-planner',icon: '💑', label: 'Couple Planner' },
  { href: '/life-events',   icon: '🎯', label: 'Life Events' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      background: '#1e293b',
      borderRight: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.25rem 0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 1.25rem 1.5rem', borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>💰</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>AI Money</div>
            <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>Mentor</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(({ href, icon, label }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.55rem 0.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                color: active ? '#22c55e' : '#94a3b8',
                background: active ? 'rgba(34,197,94,0.1)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #334155' }}>
        <div style={{ fontSize: '0.7rem', color: '#475569', lineHeight: 1.4 }}>
          For informational purposes only. Not financial advice.
        </div>
      </div>
    </aside>
  )
}
