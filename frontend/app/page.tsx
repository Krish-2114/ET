import Link from 'next/link'

const FEATURES = [
  { href: '/money-health',   icon: '❤️',  title: 'Money Health Score',  desc: 'Get your financial fitness score across 6 dimensions', color: '#ef4444' },
  { href: '/fire-planner',   icon: '🔥',  title: 'FIRE Planner',         desc: 'Calculate your path to financial independence', color: '#f97316' },
  { href: '/tax-wizard',     icon: '🧮',  title: 'Tax Wizard',            desc: 'Compare old vs new regime & maximise savings', color: '#8b5cf6' },
  { href: '/portfolio',      icon: '📊',  title: 'Portfolio X-Ray',       desc: 'Analyse your mutual fund portfolio & detect overlap', color: '#3b82f6' },
  { href: '/couple-planner', icon: '💑',  title: 'Couple Planner',        desc: 'Joint financial goals & SIP optimisation for couples', color: '#ec4899' },
  { href: '/life-events',    icon: '🎯',  title: 'Life Events',           desc: 'Get a plan for bonus, baby, home, job switch & more', color: '#22c55e' },
]

export default function HomePage() {
  return (
    <div className="fade-in">
      {/* Hero */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600, marginBottom: '0.35rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          AI-Powered Personal Finance
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>
          Welcome to AI Money Mentor 💰
        </h1>
        <p style={{ color: '#94a3b8', maxWidth: 560 }}>
          Your intelligent guide to investing, tax planning, and financial freedom — built for India.
        </p>
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Modules Available', value: '6', sub: 'All free to use' },
          { label: 'Tax Regimes Compared', value: '2', sub: 'Old vs New' },
          { label: 'Built For', value: '🇮🇳', sub: 'Indian users' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9' }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600, marginTop: '0.15rem' }}>{s.label}</div>
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.15rem' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
        All Features
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {FEATURES.map(f => (
          <Link
            key={f.href}
            href={f.href}
            style={{
              display: 'block',
              textDecoration: 'none',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '1.25rem',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
            className="feature-card"
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: `${f.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        .feature-card:hover {
          border-color: #22c55e !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}
