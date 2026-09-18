import { useEffect, useState, useMemo } from 'react';
import { apiGetAllJobs } from '../api/jobs';
import { getTmpAvatar } from '../api/tmpAvatar';

type Game = 'all' | 'ets2' | 'ats';

function fmt(n: number) { return n.toLocaleString(); }
function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function Avatar({ name, tmpId, meId, meAvatar }: { name: string; tmpId?: string; meId?: string; meAvatar?: string }) {
  const [src, setSrc] = useState(() => (tmpId && meId && tmpId === meId) ? meAvatar ?? '' : '');

  useEffect(() => {
    if (!tmpId) return;
    if (tmpId === meId) { setSrc(meAvatar ?? ''); return; }
    getTmpAvatar(tmpId).then(url => { if (url) setSrc(url); });
  }, [tmpId, meId, meAvatar]);

  if (src) {
    return <img src={src} alt={name} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const hue = [...name].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black shrink-0"
         style={{ background: `hsl(${hue},60%,55%)` }}>
      {initials}
    </div>
  );
}

function FleetSummary({ jobs }: { jobs: any[] }) {
  const drivers = new Set(jobs.map(j => j.driver?.username)).size;
  const totalKm = jobs.reduce((s, j) => s + (j.distanceDriven ?? 0), 0);
  const revenue = jobs.reduce((s, j) => s + (j.income ?? 0), 0);
  return (
    <div className="grid grid-cols-3 gap-2 mb-5">
      {[
        { label: 'Drivers',  value: fmt(drivers) },
        { label: 'Total km', value: fmt(Math.round(totalKm)) },
        { label: 'Revenue',  value: `€${fmt(revenue)}` },
      ].map(({ label, value }) => (
        <div key={label} className="card p-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-[--fg-3] mb-1">{label}</p>
          <p className="font-display text-sm text-gold leading-none break-all">{value}</p>
        </div>
      ))}
    </div>
  );
}

function FleetCard({ job, meId, meAvatar }: { job: any; meId?: string; meAvatar?: string }) {
  const [open, setOpen] = useState(false);
  const driver  = job.driver?.username || 'Unknown';
  const from    = job.source?.city?.name || '—';
  const to      = job.destination?.city?.name || '—';
  const cargo   = job.cargo?.name || 'No cargo';
  const km      = Math.round(job.distanceDriven ?? 0);
  const income  = job.income ?? 0;
  const game    = job.game?.id === 'ats' ? '🇺🇸' : '🇪🇺';
  const date    = job.realtime?.end ? fmtDate(job.realtime.end) : '';
  const damage  = ((job.trailers?.[0]?.cargoDamage ?? 0) * 100).toFixed(1);

  return (
    <div className="card mb-3 cursor-pointer active:scale-[0.99] transition-transform"
         onClick={() => setOpen(o => !o)}>
      <div className="flex items-start gap-3">
        <Avatar name={driver} tmpId={job.driver?.truckersmpId} meId={meId} meAvatar={meAvatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-gold truncate">{driver}</p>
            <p className="text-sm font-bold text-white shrink-0">€{fmt(income)}</p>
          </div>
          <p className="text-sm text-white mt-0.5 truncate">{game} {from} → {to}</p>
          <p className="text-xs text-[--fg-3] mt-0.5 truncate">{cargo}</p>
          <div className="flex gap-3 mt-1.5">
            {date && <span className="text-[10px] text-[--fg-3]">{date}</span>}
            <span className="text-[10px] text-[--fg-3]">{km} km</span>
            <span className={`text-[10px] ${parseFloat(damage) > 5 ? 'text-danger' : 'text-[--fg-3]'}`}>
              📦 {damage}%
            </span>
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-soft grid grid-cols-2 gap-y-2 gap-x-4">
          {[
            ['Truck',     `${job.truck?.model?.name ?? ''} ${job.truck?.name ?? ''}`.trim() || '—'],
            ['Server',    job.multiplayer?.server || '—'],
            ['Top Speed', `${Math.round(job.topSpeed ?? 0)} km/h`],
            ['Avg Speed', `${Math.round(parseFloat(job.avgSpeed ?? '0'))} km/h`],
            ['Fuel',      `${Math.round(job.fuel?.burned ?? 0)} L`],
            ['Earned XP', fmt(job.earnedXP ?? 0)],
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

export function FleetPage() {
  const [jobs, setJobs]       = useState<any[]>(() => {
    try { const r = localStorage.getItem('tnl_fleet'); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [loading, setLoading] = useState(jobs.length === 0);
  const [error, setError]     = useState('');
  const [game, setGame]       = useState<Game>('all');
  const [search, setSearch]   = useState('');

  const { meId, meAvatar } = useMemo(() => {
    try {
      const d = JSON.parse(localStorage.getItem('tnl_dash') ?? '{}');
      return { meId: String(d?.rider?.truckersmpId ?? ''), meAvatar: d?.rider?.avatar ?? '' };
    } catch { return { meId: '', meAvatar: '' }; }
  }, []);

  useEffect(() => {
    const load = () => {
      setLoading(true);
      apiGetAllJobs()
        .then(j => {
          setJobs(j);
          try { localStorage.setItem('tnl_fleet', JSON.stringify(j)); } catch {}
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    let list = game === 'all' ? jobs : jobs.filter(j => j.game?.id === game);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(j =>
        (j.driver?.username ?? '').toLowerCase().includes(q) ||
        (j.source?.city?.name ?? '').toLowerCase().includes(q) ||
        (j.destination?.city?.name ?? '').toLowerCase().includes(q) ||
        (j.cargo?.name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobs, game, search]);

  return (
    <div className="px-5 py-6">
      <p className="eyebrow mb-2">TNL</p>
      <h1 className="font-display text-4xl text-white mb-5">Fleet Jobs</h1>

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

      <input
        type="search"
        placeholder="Search driver, city, cargo…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-elevated border border-soft text-white text-sm
                   placeholder:text-[--fg-3] focus:outline-none focus:border-[--bd-gold] mb-5 transition-colors"
      />

      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      {!loading && <FleetSummary jobs={filtered} />}

      {loading
        ? [...Array(6)].map((_, i) => (
            <div key={i} className="card mb-3">
              <div className="flex gap-3">
                <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="skeleton w-[40%] h-2.5 mb-2" />
                  <div className="skeleton w-[60%] h-3.5 mb-2" />
                  <div className="skeleton w-[35%] h-2.5" />
                </div>
              </div>
            </div>
          ))
        : filtered.length
          ? filtered.map((j, i) => <FleetCard key={j.jobID ?? i} job={j} meId={meId} meAvatar={meAvatar} />)
          : <p className="text-sm text-[--fg-3] text-center mt-10">No jobs found.</p>
      }
    </div>
  );
}
