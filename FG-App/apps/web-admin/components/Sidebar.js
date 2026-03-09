import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV = [
  { href: '/', icon: '📋', label: 'Live Orders' },
  { href: '/analytics', icon: '📊', label: 'Analytics' },
  { href: '/menu', icon: '🍽️', label: 'Menu' },
];

export default function Sidebar() {
  const router = useRouter();
  const s = styles;
  return (
    <aside style={s.sidebar}>
      <div style={s.logo}>
        <div style={s.badge}>F&G</div>
        <div>
          <div style={s.title}>Partner Portal</div>
          <div style={s.sub}>Noida Sector 62</div>
        </div>
      </div>
      <nav style={s.nav}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{
            ...s.navItem,
            ...(router.pathname === n.href ? s.active : {}),
          }}>
            <span style={{ fontSize: 18 }}>{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
      <div style={s.footer}>
        <div style={s.storeBadge}>🟢 Store Open</div>
        <div style={s.version}>F&G v2.0 · Swiggy-class</div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: { width: 220, background: '#111', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', padding: '20px 0', minHeight: '100vh' },
  logo: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px 20px', borderBottom: '1px solid #1a1a1a', marginBottom: 12 },
  badge: { width: 38, height: 38, background: 'linear-gradient(135deg,#FF5722,#c0392b)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: '#fff' },
  title: { fontSize: 13, fontWeight: 800, color: '#f0f0f0' },
  sub: { fontSize: 10, color: '#666', marginTop: 2 },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4, padding: '0 8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#888', textDecoration: 'none', transition: 'all 0.15s' },
  active: { background: '#FF572214', color: '#FF5722' },
  footer: { padding: '16px', borderTop: '1px solid #1a1a1a' },
  storeBadge: { fontSize: 11, color: '#22c55e', fontWeight: 700, marginBottom: 4 },
  version: { fontSize: 9, color: '#444' },
};
