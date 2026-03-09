import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';

const SERVER_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3007';

const COLORS = {
  brand: '#FF5722', green: '#22c55e', red: '#ef4444',
  yellow: '#f59e0b', purple: '#a855f7',
};

const STATUS_COLOR = { placed: COLORS.brand, confirmed: '#1DA1F2', preparing: COLORS.yellow, rider_assigned: COLORS.purple, picked_up: '#26A69A', on_the_way: '#FF7043', delivered: COLORS.green, rejected: COLORS.red };

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({ pending: 0, preparing: 0, out: 0, done: 0, revenue: 0 });
  const [log, setLog] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_restaurant', { restaurantId: 'r1' });
      addLog('🟢 Connected to F&G Realtime Server');
    });
    socket.on('disconnect', () => { setIsConnected(false); addLog('🔴 Disconnected'); });

    socket.on('new_order', (order) => {
      setOrders(prev => ({ ...prev, [order.orderId]: { ...order, receivedAt: Date.now() } }));
      setStats(s => ({ ...s, pending: s.pending + 1 }));
      addLog(`📋 New Order #${order.orderId} · ₹${order.total ?? '—'}`);
    });

    socket.on('order_update', ({ orderId, status }) => {
      setOrders(prev => prev[orderId] ? { ...prev, [orderId]: { ...prev[orderId], status } } : prev);
      addLog(`📍 Order #${orderId} → ${status.toUpperCase()}`);
    });

    return () => socket.disconnect();
  }, []);

  function addLog(msg) {
    setLog(prev => [{ msg, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  }

  function acceptOrder(orderId) {
    socketRef.current?.emit('accept_order', { orderId, restaurantId: 'r1' });
    setOrders(prev => ({ ...prev, [orderId]: { ...prev[orderId], status: 'confirmed' } }));
    setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1), preparing: s.preparing + 1 }));
    addLog(`✅ Accepted Order #${orderId}`);
  }

  function rejectOrder(orderId) {
    socketRef.current?.emit('reject_order', { orderId, reason: 'Restaurant busy' });
    setOrders(prev => ({ ...prev, [orderId]: { ...prev[orderId], status: 'rejected' } }));
    setStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }));
    addLog(`❌ Rejected Order #${orderId}`);
  }

  const activeOrders = Object.values(orders).filter(o => !['delivered', 'rejected', 'cancelled'].includes(o.status));

  return (
    <>
      <Head>
        <title>F&G Restaurant Dashboard</title>
        <meta name="description" content="F&G Restaurant Partner Dashboard — Real-Time Order Management" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div style={s.page}>
        {/* Header */}
        <header style={s.header}>
          <div style={s.logo}>
            <div style={s.logoBadge}>F&G</div>
            <div>
              <div style={s.logoTitle}>Restaurant Dashboard</div>
              <div style={s.logoSub}>Real-Time Order Management</div>
            </div>
          </div>
          <div style={{ ...s.badge, borderColor: isConnected ? COLORS.green + '44' : '#333' }}>
            <div style={{ ...s.dot, background: isConnected ? COLORS.green : COLORS.red }} />
            <span style={{ color: isConnected ? COLORS.green : COLORS.red, fontSize: 12, fontWeight: 700 }}>
              {isConnected ? 'LIVE' : 'CONNECTING'}
            </span>
          </div>
        </header>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { label: 'Pending', value: stats.pending, icon: '📋', color: COLORS.brand },
            { label: 'Preparing', value: stats.preparing, icon: '👨‍🍳', color: COLORS.yellow },
            { label: 'Out for Delivery', value: stats.out, icon: '🛵', color: COLORS.purple },
            { label: 'Delivered Today', value: stats.done, icon: '✅', color: COLORS.green },
          ].map((stat, i) => (
            <div key={i} style={s.statCard}>
              <div style={{ fontSize: 28 }}>{stat.icon}</div>
              <div style={{ ...s.statVal, color: stat.color }}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div style={s.grid}>
          {/* Orders panel */}
          <div style={s.panel}>
            <div style={s.panelTitle}>
              🔔 Live Orders
              {stats.pending > 0 && <span style={s.newBadge}>{stats.pending} NEW</span>}
            </div>
            {activeOrders.length === 0 ? (
              <div style={s.empty}>No active orders. Waiting...</div>
            ) : activeOrders.map(order => (
              <div key={order.orderId} style={{ ...s.orderCard, ...(order.status === 'placed' ? s.newOrder : {}) }}>
                <div style={s.orderHead}>
                  <span style={s.orderId}>#{order.orderId}</span>
                  <span style={{ ...s.statusChip, background: (STATUS_COLOR[order.status] || '#888') + '22', color: STATUS_COLOR[order.status] || '#888' }}>
                    {order.status?.toUpperCase()}
                  </span>
                </div>
                <div style={s.orderItems}>
                  {order.items?.map?.(i => i.name)?.join(', ') || 'Food / Grocery items'}
                </div>
                <div style={s.orderFoot}>
                  <span style={s.orderTotal}>₹{order.total ?? '—'}</span>
                  {order.status === 'placed' && (
                    <div style={s.btnRow}>
                      <button style={s.acceptBtn} onClick={() => acceptOrder(order.orderId)}>✅ Accept</button>
                      <button style={s.rejectBtn} onClick={() => rejectOrder(order.orderId)}>Reject</button>
                    </div>
                  )}
                </div>
                {/* 90s accept timer bar */}
                {order.status === 'placed' && <TimerBar duration={90} color={COLORS.brand} />}
              </div>
            ))}
          </div>

          {/* Event log panel */}
          <div style={s.panel}>
            <div style={s.panelTitle}>📡 Event Log</div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {log.map((entry, i) => (
                <div key={i} style={s.logEntry}>
                  <div style={s.logTime}>{entry.time}</div>
                  <div style={s.logMsg}>{entry.msg}</div>
                </div>
              ))}
              {log.length === 0 && <div style={s.empty}>Events will appear here...</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TimerBar({ duration, color }) {
  const [width, setWidth] = useState(100);
  useEffect(() => {
    const step = 100 / (duration * 10);
    const t = setInterval(() => setWidth(w => Math.max(0, w - step)), 100);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ height: 3, background: '#222', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 2, transition: 'width 0.1s linear' }} />
    </div>
  );
}

const s = {
  page: { fontFamily: 'Inter, sans-serif', background: '#0F0F0F', minHeight: '100vh', color: '#f0f0f0' },
  header: { background: 'linear-gradient(135deg, #1a0500, #0F0F0F)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a' },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoBadge: { width: 44, height: 44, background: 'linear-gradient(135deg, #FF5722, #c0392b)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff' },
  logoTitle: { fontSize: 18, fontWeight: 900 },
  logoSub: { fontSize: 11, color: '#888' },
  badge: { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: '1px solid', borderRadius: 999 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '20px 24px' },
  statCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 20, textAlign: 'center' },
  statVal: { fontSize: 28, fontWeight: 900 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '0 24px 24px' },
  panel: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 20 },
  panelTitle: { fontSize: 15, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  newBadge: { background: '#FF5722', color: '#fff', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 999 },
  orderCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, padding: 14, marginBottom: 10 },
  newOrder: { borderColor: '#FF5722', boxShadow: '0 0 20px #FF572222' },
  orderHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontWeight: 800, fontSize: 14, color: '#FF5722' },
  statusChip: { fontSize: 9, fontWeight: 900, padding: '3px 8px', borderRadius: 999 },
  orderItems: { fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 1.5 },
  orderFoot: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  orderTotal: { fontSize: 18, fontWeight: 900 },
  btnRow: { display: 'flex', gap: 8 },
  acceptBtn: { padding: '7px 14px', background: COLORS.green, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  rejectBtn: { padding: '7px 14px', background: 'transparent', color: COLORS.red, border: `1px solid ${COLORS.red}`, borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif' },
  logEntry: { padding: '8px 0', borderBottom: '1px solid #1a1a1a' },
  logTime: { color: '#555', fontSize: 10 },
  logMsg: { color: '#f0f0f0', fontSize: 12, marginTop: 2 },
  empty: { textAlign: 'center', color: '#555', padding: 40, fontSize: 13 },
};
