import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiGetMyJobs } from '../api/jobs';

type Game = 'all' | 'ets2' | 'ats';

function fmt(n: number) { return n.toLocaleString(); }
function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function StatBar({ jobs }: { jobs: any[] }) {
  const totalKm  = jobs.reduce((s, j) => s + (j.distanceDriven ?? 0), 0);
  const revenue  = jobs.reduce((s, j) => s + (j.income ?? 0), 0);
  const avgRating = jobs.filter(j => j.rating > 0).length
    ? (jobs.filter(j => j.rating > 0).reduce((s, j) => s + j.rating, 0) / jobs.filter(j => j.rating > 0).length * 20).toFixed(1)
    : '—';

  return (
    <div className="grid grid-cols-2 gap-2 mb-5">
      {[
        { label: 'Jobs',     value: fmt(jobs.length) },
        { label: 'Distance', value: `${fmt(Math.round(totalKm))} km` },
        { label: 'Revenue',  value: `€${fmt(revenue)}` },
        { label: 'Avg Rating', value: `${avgRating}%` },
      ].map(({ label, value }) => (
        <div key={label} className="card p-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[--fg-3] mb-1">{label}</p>
          <p className="font-display text-sm text-gold leading-none break-all">{value}</p>
        </div>
      ))}
    </div>
  );
}

function JobCard({ job }: { job: any }) {
  const [open, setOpen] = useState(false);
  const from    = job.source?.city?.name || '—';
  const to      = job.destination?.city?.name || '—';
  const cargo   = job.cargo?.name || 'No cargo';
  const km      = Math.round(job.distanceDriven ?? 0);
  const income  = job.income ?? 0;
  const fuel    = Math.round(job.fuel?.burned ?? 0);
  const damage  = ((job.trailers?.[0]?.cargoDamage ?? 0) * 100).toFixed(1);
  const truck   = `${job.truck?.model?.name ?? ''} ${job.truck?.name ?? ''}`.trim();
  const game    = job.game?.id === 'ats' ? '🇺🇸' : '🇪🇺';
  const date    = job.realtime?.end ? fmtDate(job.realtime.end) : '';
  const mins    = job.realtime?.timeTaken ? Math.round(job.realtime.timeTaken / 60) : 0;

  return (
    <div className="card mb-3 cursor-pointer active:scale-[0.99] transition-transform"
         onClick={() => setOpen(o => !o)}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {game} {from} → {to}
          </p>
          <p className="text-xs text-[--fg-3] mt-0.5 truncate">{cargo}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gold">€{fmt(income)}</p>
          <p className="text-[10px] text-[--fg-3]">{km} km</p>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex gap-3 mt-2.5">
        {date && <span className="text-[10px] text-[--fg-3]">{date}</span>}
        {mins > 0 && <span className="text-[10px] text-[--fg-3]">⏱ {mins}m</span>}
        <span className="text-[10px] text-[--fg-3]">⛽ {fuel}L</span>
        <span className={`text-[10px] ${parseFloat(damage) > 5 ? 'text-danger' : 'text-[--fg-3]'}`}>
          📦 {damage}%
        </span>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="mt-3 pt-3 border-t border-soft grid grid-cols-2 gap-y-2 gap-x-4">
          {[
            ['Truck',       truck || '—'],
            ['Server',      job.multiplayer?.server || '—'],
            ['Planned',     `${job.plannedDistance ?? 0} km`],
            ['Top Speed',   `${Math.round(job.topSpeed ?? 0)} km/h`],
            ['Avg Speed',   `${Math.round(parseFloat(job.avgSpeed ?? '0'))} km/h`],
            ['Earned XP',   fmt(job.earnedXP ?? 0)],
            ['Auto Parked', job.autoParked ? 'Yes' : 'No'],
            ['Market',      job.market?.name || '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[9px] uppercase tracking-widest text-[--fg-3]">{label}</p>
              <p className="text-xs text-white mt-0.5 truncate">{val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="text-[10px] text-[--fg-3] mt-2 text-right">
        {open ? '▲ less' : '▼ more'}
      </div>
    </div>
  );
}

export function MyJobsPage() {
  const { token } = useAuthStore();
  const [jobs, setJobs]     = useState<any[]>(() => {
    try { const r = localStorage.getItem('tnl_my_jobs'); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [loading, setLoading] = useState(jobs.length === 0);
  const [error, setError]     = useState('');
  const [game, setGame]       = useState<Game>('all');
  const [search, setSearch]   = useState('');

  // Get tmpId from cached dashboard
  const tmpId = useMemo(() => {
    try {
      const d = localStorage.getItem('tnl_dash');
      return d ? JSON.parse(d)?.rider?.truckersmpId : null;
    } catch { return null; }
  }, []);

  useEffect(() => {
    if (!tmpId) return;
    const load = () => {
      setLoading(true);
      apiGetMyJobs(String(tmpId))
        .then(j => {
          setJobs(j);
          try { localStorage.setItem('tnl_my_jobs', JSON.stringify(j)); } catch {}
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, [tmpId]);

  const filtered = useMemo(() => {
    let list = game === 'all' ? jobs : jobs.filter(j => j.game?.id === game);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j =>
        (j.source?.city?.name ?? '').toLowerCase().includes(q) ||
        (j.destination?.city?.name ?? '').toLowerCase().includes(q) ||
        (j.cargo?.name ?? '').toLowerCase().includes(q) ||
        (j.truck?.model?.name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobs, game, search]);

  return (
    <div className="px-5 py-6">
      <p className="eyebrow mb-2">Personal</p>
      <h1 className="font-display text-4xl text-white mb-5">My Jobs</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'ets2', 'ats'] as Game[]).map(g => (
          <button key={g} onClick={() => setGame(g)}
                  className={`pill ${game === g ? 'pill-active' : 'pill-inactive'}`}>
            {g === 'all' ? 'All' : g.toUpperCase()}
            <span className="ml-1 opacity-60">
              ({g === 'all' ? jobs.length : jobs.filter(j => j.game?.id === g).length})
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search city, cargo, truck…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-elevated border border-soft text-white text-sm
                   placeholder:text-[--fg-3] focus:outline-none focus:border-[--bd-gold] mb-5 transition-colors"
      />

      {error && (
        <p className="text-sm text-danger mb-4">{error}</p>
      )}

      {/* Stats bar */}
      {!loading && <StatBar jobs={filtered} />}

      {/* Job list */}
      {loading
        ? [...Array(5)].map((_, i) => (
            <div key={i} className="card mb-3">
              <div className="flex justify-between mb-2">
                <div className="skeleton w-[55%] h-3.5" />
                <div className="skeleton w-[20%] h-3.5" />
              </div>
              <div className="skeleton w-[35%] h-2.5 mb-2" />
              <div className="flex gap-3">
                {[...Array(3)].map((_, j) => <div key={j} className="skeleton w-10 h-2.5" />)}
              </div>
            </div>
          ))
        : filtered.length
          ? filtered.map((j, i) => <JobCard key={j.jobID ?? i} job={j} />)
          : <p className="text-sm text-[--fg-3] text-center mt-10">No jobs found.</p>
      }
    </div>
  );
}
