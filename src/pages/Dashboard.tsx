import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiGetDashboard, apiGetUserJobs, type DashboardData } from '../api/dashboard';

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString(); }

function StatCard({ label, value, unit, gold }: { label: string; value: string; unit?: string; gold?: boolean }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[--fg-3]">{label}</p>
      <p className={`font-display text-2xl leading-none ${gold ? 'text-gold' : 'text-white'}`}>
        {value}
        {unit && <span className="text-sm font-sans text-[--fg-3] ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card flex flex-col gap-2">
      <div className="skeleton w-2/3 h-2.5" />
      <div className="skeleton w-4/5 h-6" />
    </div>
  );
}

function JobRow({ job }: { job: any }) {
  const from  = job.source?.city?.name || '—';
  const to    = job.destination?.city?.name || '—';
  const cargo = job.cargo?.name || 'No cargo';
  const km    = job.distanceDriven ? `${Math.round(job.distanceDriven)} km` : '';
  const game  = job.game?.id === 'ats' ? '🇺🇸' : '🇪🇺';
  return (
    <div className="flex items-center justify-between py-3 border-b border-soft last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{game} {from} → {to}</p>
        <p className="text-xs text-[--fg-3] mt-0.5 truncate">{cargo}</p>
      </div>
      {km && <span className="text-xs text-gold font-mono ml-2 shrink-0">{km}</span>}
    </div>
  );
}

function EventRow({ event }: { event: any }) {
  const name = event.name || event.title || event.event_name || '—';
  const date = event.date || event.event_date || '';
  return (
    <div className="flex items-center justify-between py-3 border-b border-soft last:border-0">
      <p className="text-sm text-white">{name}</p>
      {date && <span className="text-xs text-[--fg-3]">{new Date(date).toLocaleDateString()}</span>}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { token, logout } = useAuthStore();
  const [data, setData]       = useState<DashboardData | null>(() => {
    try { const r = localStorage.getItem('tnl_dash'); return r ? JSON.parse(r) : null; } catch { return null; }
  });
  const [jobs, setJobs]       = useState<any[]>(() => {
    try { const r = localStorage.getItem('tnl_dash_jobs'); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError]     = useState('');

  const load = useCallback(async (silent = false) => {
    if (!token) return;
    if (!silent) setLoading(true);
    setError('');
    try {
      const d = await apiGetDashboard(token);
      const tmpId = d?.rider?.truckersmpId;
      const j = tmpId ? await apiGetUserJobs(String(tmpId)) : [];
      setData(d);
      setJobs(j);
      try {
        localStorage.setItem('tnl_dash', JSON.stringify(d));
        localStorage.setItem('tnl_dash_jobs', JSON.stringify(j));
      } catch {}
    } catch (e: any) {
      if (e.message === 'SESSION_EXPIRED') { logout(); return; }
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => { if (!data || jobs.length === 0) load(); }, []);

  // ── derive stats ──
  const snapshot  = data?.truckershubStats?.snapshot;
  const stats     = snapshot?.statistics;
  const name      = data?.rider?.username?.split(' ')[0] ?? 'Driver';
  const totalKm   = snapshot?.distance ?? 0;
  const totalJobs = snapshot?.jobs ?? 0;
  const revenue   = snapshot?.income ?? 0;
  const level     = snapshot?.level ?? 0;
  const avgRating = stats?.rating?.avg ? parseFloat((stats.rating.avg * 20).toFixed(1)) : 0;
  const avgSpeed  = stats?.speed?.avg ? Math.round(stats.speed.avg) : 0;
  const avgDist   = stats?.distance?.avg ? Math.round(stats.distance.avg) : 0;
  const hours     = stats?.distance?.total ? Math.round(stats.distance.total / 80) : 0;
  const recentJobs   = jobs.slice(0, 5);
  const recentEvents = (data?.attendance?.eventsAttended ?? []).slice(0, 4);

  return (
    <div className="px-5 py-6">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="eyebrow mb-1">Driver Dashboard</p>
          <h1 className="font-display text-3xl text-white leading-tight">
            Welcome back, <span className="text-gold">{loading ? '…' : name}.</span>
          </h1>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="mt-1 px-3 py-2 bg-gold/10 border border-[--bd-gold] rounded-lg text-gold text-xs font-semibold active:scale-95 transition-transform disabled:opacity-40"
        >
          🔄
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
          {error}
        </div>
      )}

      {/* Top stats */}
      <p className="eyebrow mb-3">Career Stats</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {loading ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />) : <>
          <StatCard label="Total Distance" value={fmt(totalKm)} unit="km" />
          <StatCard label="Jobs Completed" value={fmt(totalJobs)} />
          <StatCard label="Revenue"        value={`€${fmt(revenue)}`} />
          <StatCard label="Driver Level"   value={String(level)} unit="/ 30" gold />
        </>}
      </div>

      {/* Performance stats */}
      <p className="eyebrow mb-3">Performance</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {loading ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />) : <>
          <StatCard label="Avg Rating"   value={String(avgRating)} unit="%" />
          <StatCard label="Avg Speed"    value={String(avgSpeed)}  unit="km/h" />
          <StatCard label="Avg Distance" value={String(avgDist)}   unit="km" />
          <StatCard label="Hours Driven" value={String(hours)}     unit="hrs" />
        </>}
      </div>

      {/* Recent jobs */}
      <div className="card mb-4">
        <p className="eyebrow mb-3">Recent Jobs</p>
        {loading
          ? [...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 mb-2 rounded-lg" />)
          : recentJobs.length
            ? recentJobs.map((j, i) => <JobRow key={i} job={j} />)
            : <p className="text-sm text-[--fg-3]">No jobs yet.</p>
        }
      </div>

      {/* Recent events */}
      <div className="card">
        <p className="eyebrow mb-3">Events Attended</p>
        {loading
          ? [...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 mb-2 rounded-lg" />)
          : recentEvents.length
            ? recentEvents.map((e: any, i: number) => <EventRow key={i} event={e} />)
            : <p className="text-sm text-[--fg-3]">No events yet.</p>
        }
      </div>
    </div>
  );
}
