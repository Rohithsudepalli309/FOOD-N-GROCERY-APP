import Head from 'next/head';
import { useState, useEffect } from 'react';

const COLORS = { brand: '#FF5722', green: '#22c55e', yellow: '#f59e0b', purple: '#a855f7', blue: '#1DA1F2' };

// Simple bar chart using inline SVG (no chart library needed)
function BarChart({ data, color = COLORS.brand }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 9, color: '#666' }}>₹{(d.value / 1000).toFixed(1)}k</div>
          <div style={{ width: '100%', height: `${(d.value / max) * 90}px`, background: color, borderRadius: '4px 4px 0 0', minHeight: 4, opacity: 0.85 }} />
          <div style={{ fontSize: 9, color: '#555', textAlign: 'center' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, color = COLORS.green }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const W = 300, H = 80;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.value - min) / (max - min || 1)) * (H - 10) - 5;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((d.value - min) / (max - min || 1)) * (H - 10) - 5;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    // In production: fetch from analytics-service
    const revenue = Array.from({ length: 7 }, (_, i) => ({
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      value: 6000 + Math.floor(Math.random() * 8000),
    }));
    const orders = Array.from({ length: 7 }, (_, i) => ({
      label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      value: 12 + Math.floor(Math.random() * 28),
    }));
    const topDishes = [
      { name: 'Chicken Biryani', count: 89, revenue: 24831 },
      { name: 'Paneer Tikka', count: 67, revenue: 16733 },
      { name: 'Dal Makhani', count: 54, revenue: 10746 },
      { name: 'Gulab Jamun', count: 48, revenue: 4752 },
    ];
    setData({ revenue, orders, topDishes, stats: { revenueWeek: 68420, ordersWeek: 128, avgOrderVal: 535, avgRating: 4.4, avgDelivery: 32 } });
  }, [period]);

  if (!data) return <div style={{ padding: 40, color: '#666' }}>Loading analytics...</div>;

  return (
    <>
      <Head><title>Analytics — F&G Partner Portal</title></Head>
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>📊 Analytics</h1>
            <p style={s.sub}>Revenue & performance for your restaurant</p>
          </div>
          <div style={s.periodRow}>
            {['week', 'month'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ ...s.periodBtn, ...(period === p ? s.periodActive : {}) }}>
                {p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div style={s.kpiRow}>
          {[
            { label: 'Revenue', value: `₹${(data.stats.revenueWeek / 1000).toFixed(1)}k`, icon: '💰', color: COLORS.green, sub: '+12% vs last week' },
            { label: 'Orders', value: data.stats.ordersWeek, icon: '📋', color: COLORS.brand, sub: '18/day avg' },
            { label: 'Avg Order', value: `₹${data.stats.avgOrderVal}`, icon: '🧾', color: COLORS.purple, sub: 'Per transaction' },
            { label: 'Avg Rating', value: data.stats.avgRating + '⭐', icon: '⭐', color: COLORS.yellow, sub: '347 reviews' },
            { label: 'Avg Delivery', value: data.stats.avgDelivery + ' min', icon: '🛵', color: COLORS.blue, sub: 'End to end' },
          ].map((k, i) => (
            <div key={i} style={s.kpi}>
              <div style={{ fontSize: 24 }}>{k.icon}</div>
              <div style={{ ...s.kpiVal, color: k.color }}>{k.value}</div>
              <div style={s.kpiLabel}>{k.label}</div>
              <div style={s.kpiSub}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={s.grid}>
          {/* Revenue chart */}
          <div style={s.card}>
            <div style={s.cardTitle}>💰 Daily Revenue (₹)</div>
            <BarChart data={data.revenue} color={COLORS.brand} />
            <div style={s.chartTotal}>Week total: ₹{data.stats.revenueWeek.toLocaleString()}</div>
          </div>

          {/* Orders chart */}
          <div style={s.card}>
            <div style={s.cardTitle}>📦 Orders per Day</div>
            <BarChart data={data.orders} color={COLORS.purple} />
            <div style={s.chartTotal}>Week total: {data.stats.ordersWeek} orders</div>
          </div>

          {/* Revenue trend line */}
          <div style={s.card}>
            <div style={s.cardTitle}>📈 Revenue Trend</div>
            <LineChart data={data.revenue} color={COLORS.green} />
          </div>

          {/* Top dishes */}
          <div style={s.card}>
            <div style={s.cardTitle}>🏆 Top Dishes this Week</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead>
                <tr>{['Dish', 'Orders', 'Revenue'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.topDishes.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={s.td}>{i + 1}. {d.name}</td>
                    <td style={{ ...s.td, color: COLORS.brand }}>{d.count}</td>
                    <td style={{ ...s.td, color: COLORS.green }}>₹{d.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Surge heatmap placeholder */}
        <div style={{ ...s.card, margin: '0 24px 24px' }}>
          <div style={s.cardTitle}>🔥 Peak Hours Heatmap</div>
          <div style={s.heatmapRow}>
            {Array.from({ length: 24 }, (_, h) => {
              const isPeak = (h >= 12 && h <= 14) || (h >= 19 && h <= 22);
              const isSemi = (h >= 10 && h <= 12) || (h >= 17 && h <= 19);
              const intensity = isPeak ? 0.9 : isSemi ? 0.5 : 0.15;
              return (
                <div key={h} style={{ ...s.heatCell, opacity: intensity, background: isPeak ? COLORS.brand : COLORS.yellow }}>
                  <div style={s.heatHour}>{h}</div>
                </div>
              );
            })}
          </div>
          <div style={s.heatLegend}>
            <span style={{ color: COLORS.brand, fontSize: 11 }}>🔴 Peak surge hours</span>
            <span style={{ color: COLORS.yellow, fontSize: 11 }}>🟡 Semi-peak</span>
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  page: { padding: 24, minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 900 },
  sub: { color: '#888', fontSize: 12, marginTop: 4 },
  periodRow: { display: 'flex', gap: 8 },
  periodBtn: { padding: '7px 14px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#888', fontSize: 12, fontWeight: 600 },
  periodActive: { background: '#FF572214', borderColor: '#FF5722', color: '#FF5722' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 },
  kpi: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 16, textAlign: 'center' },
  kpiVal: { fontSize: 22, fontWeight: 900, margin: '6px 0' },
  kpiLabel: { fontSize: 11, color: '#888', fontWeight: 700 },
  kpiSub: { fontSize: 9, color: '#555', marginTop: 3 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
  card: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 14, fontWeight: 800, marginBottom: 16 },
  chartTotal: { textAlign: 'right', fontSize: 11, color: '#666', marginTop: 8 },
  th: { textAlign: 'left', fontSize: 10, color: '#555', fontWeight: 700, paddingBottom: 8, textTransform: 'uppercase' },
  td: { padding: '8px 0', fontSize: 12, color: '#ccc' },
  heatmapRow: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  heatCell: { width: 34, height: 34, borderRadius: 6, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 3 },
  heatHour: { fontSize: 9, color: '#fff', fontWeight: 700 },
  heatLegend: { display: 'flex', gap: 16, marginTop: 12 },
};
