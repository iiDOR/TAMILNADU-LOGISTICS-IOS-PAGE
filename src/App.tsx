import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { TabBar } from './components/TabBar';
import { TopBar } from './components/TopBar';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { MyJobsPage } from './pages/MyJobs';
import { FleetPage } from './pages/Fleet';
import { EventsPage } from './pages/Events';

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
}

export default function App() {
  const { isAuthenticated, hydrate } = useAuthStore();

  if (!isMobile()) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', background:'#000', color:'#fff', textAlign:'center', padding:'0 24px' }}>
        <img src="/icons/icon-192.png" alt="TNL" style={{ width:72, height:72, borderRadius:16, marginBottom:24 }} />
        <h1 style={{ fontFamily:'sans-serif', fontSize:24, fontWeight:700, marginBottom:12 }}>TNL Tracker</h1>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, maxWidth:320 }}>
          TNL Tracker is a mobile app. Open it on your iPhone or Android device.
        </p>
      </div>
    );
  }
  const [offline, setOffline] = useState(!navigator.onLine);
  const { needRefresh, updateServiceWorker } = useRegisterSW();

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col bg-base overflow-hidden"
         style={{
           height: '100dvh',
           paddingTop: 'var(--sat)',
           paddingBottom: 'calc(var(--sab) + var(--tab-bar-h))',
           paddingLeft: 'var(--sal)',
           paddingRight: 'var(--sar)',
         }}>
      <TopBar />

      {/* Offline banner */}
      {offline && (
        <div className="bg-elevated border-b border-soft px-4 py-2 text-center text-xs text-[--fg-3]">
          You're offline — showing cached data
        </div>
      )}

      {/* Update available banner */}
      {needRefresh && (
        <div className="bg-gold/10 border-b border-[--bd-gold] px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-gold">Update available</span>
          <button onClick={() => updateServiceWorker(true)}
                  className="text-xs font-bold text-gold underline">Reload</button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/my-jobs"   element={<MyJobsPage />} />
          <Route path="/fleet"     element={<FleetPage />} />
          <Route path="/events"    element={<EventsPage />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
