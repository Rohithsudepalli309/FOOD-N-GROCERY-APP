import Sidebar from '../components/Sidebar';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <div style={{ display: 'flex', background: '#0F0F0F', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#f0f0f0' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
