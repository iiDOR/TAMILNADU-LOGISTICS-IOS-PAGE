import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

const TNL_API  = 'https://api.tamilnadulogistics.in/api/events/';
const VTC_API  = 'https://tnl.wispbyte.app/api/tmp/vtc/70030/events/attending';
const CACHE_KEY = 'tnl_events';

interface TNLEvent {
  _id: string;
  title: string;
  startDate: string;
  departureDate?: string;
  server: string;
  route: string;
  banner?: string;
  map?: string;
  distance?: number;
  attendances?: { confirmed?: number };
  slots?: any[];
  source: 'tnl' | 'truckersmp';
}

function dedupKey(e: TNLEvent): string {
  for (const f of [e.banner, e.map]) {
    if (f) {
      const name = f.split('/').pop()?.split('.')[0] ?? '';
      if (name && /^\d+$/.test(name)) return name;
    }
  }
  return e._id;
}

// Parse API dates as UTC (no Z = UTC from backend)
function parseUTC(iso: string): Date {
  return new Date(iso.includes('Z') || iso.includes('+') ? iso : iso + 'Z');
}
function isPast(iso: string) { return parseUTC(iso) < new Date(); }
function isToday(iso: string) {
  const d = parseUTC(iso), n = new Date();
  return d.getUTCDate() === n.getUTCDate() && d.getUTCMonth() === n.getUTCMonth() && d.getUTCFullYear() === n.getUTCFullYear();
}
function inMonth(iso: string, month: number, year: number) {
  const d = parseUTC(iso);
  return d.getUTCMonth() === month && d.getUTCFullYear() === year;
}
// Display in UTC — matches TruckersMP event page dates
function fmtDate(iso: string) {
  return parseUTC(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
function fmtTime(iso: string) {
  return parseUTC(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function useCountdown(iso: string) {
  const calc = () => {
    const diff = parseUTC(iso).getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, diff };
  };
  const [val, setVal] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setVal(calc()), 1000);
    return () => clearInterval(id);
  }, [iso]);
  return val;
}

function Countdown({ iso }: { iso: string }) {
  const v = useCountdown(iso);
  if (!v) return <span className="text-[10px] text-green-400 font-bold tracking-widest">HAPPENING NOW</span>;
  if (v.diff > 86400000) {
    const days = Math.floor(v.diff / 86400000);
    return <span className="text-[10px] font-mono text-[--fg-3]">in {days}d {v.h % 24}h</span>;
  }
  return (
    <span className="text-[10px] font-mono text-gold font-bold">
      {String(v.h).padStart(2,'0')}:{String(v.m).padStart(2,'0')}:{String(v.s).padStart(2,'0')}
    </span>
  );
}

function GameChip({ server }: { server: string }) {
  const isAts = server.includes('ATS') || server.includes('American');
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isAts ? 'bg-orange-500/20 text-orange-400' : 'bg-gold/15 text-gold'}`}>
      {isAts ? 'ATS' : 'ETS2'}
    </span>
  );
}

// Full-width hero card for today's event
function FeaturedCard({ ev }: { ev: TNLEvent }) {
  const target = ev.departureDate || ev.startDate;
  const happening = !isPast(target) && isToday(target);

  return (
    <div className="card border-[--bd-gold] mb-4 overflow-hidden">
      {ev.banner && (
        <img src={ev.banner} alt={ev.title}
             className="w-full h-40 object-cover rounded-lg mb-3" />
      )}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gold/20 text-gold tracking-widest">FEATURED</span>
        <GameChip server={ev.server} />
        <span className="text-[9px] px-1.5 py-0.5 rounded border border-soft text-[--fg-3]">{ev.server}</span>
        {ev.source === 'truckersmp' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">TMP</span>
        )}
      </div>
      <h2 className="font-semibold text-white text-base leading-snug mb-1">{ev.title}</h2>
      {ev.departureDate && (
        <p className="text-[10px] font-mono text-[--fg-3] mb-0.5">
          MEETUP: {fmtDate(ev.departureDate)} · {fmtTime(ev.departureDate)}
        </p>
      )}
      <p className="text-[10px] font-mono text-[--fg-3] mb-3">
        START: {fmtDate(ev.startDate)} · {fmtTime(ev.startDate)}
        {happening && (
          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 border border-green-500/40 text-green-400 text-[9px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Happening Now
          </span>
        )}
      </p>

      <div className="mb-3">
        <Countdown iso={target} />
      </div>

      <div className="space-y-1 text-xs text-[--fg-2] font-mono">
        <div><span className="text-gold font-bold">Route: </span>{ev.route}</div>
        {ev.distance && <div><span className="text-gold font-bold">Distance: </span>{ev.distance} km</div>}
      </div>

      {ev.map && (
        <img src={ev.map} alt="route map" className="w-full rounded-lg mt-3 max-h-40 object-cover" />
      )}
    </div>
  );
}

// Compact card for upcoming runs
function EventCard({ ev }: { ev: TNLEvent }) {
  const [open, setOpen] = useState(false);
  const target = ev.departureDate || ev.startDate;

  return (
    <div className="card mb-3 cursor-pointer active:scale-[0.99] transition-transform"
         onClick={() => setOpen(o => !o)}>
      {open && ev.banner && (
        <img src={ev.banner} alt={ev.title}
             className="w-full h-28 object-cover rounded-lg mb-3" />
      )}
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
        <GameChip server={ev.server} />
        <span className="text-[9px] px-1.5 py-0.5 rounded border border-soft text-[--fg-3]">{ev.server}</span>
        {ev.source === 'truckersmp' && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">TMP</span>
        )}
      </div>
      <p className="text-sm font-semibold text-white leading-snug mb-1">{ev.title}</p>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-[--fg-3]">
          {fmtDate(ev.startDate)} · {fmtTime(ev.startDate)}
        </p>
        <Countdown iso={target} />
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-soft space-y-1.5">
          <div className="text-xs font-mono">
            <span className="text-gold font-bold">Route: </span>
            <span className="text-[--fg-2]">{ev.route}</span>
          </div>
          {ev.departureDate && (
            <div className="text-xs font-mono">
              <span className="text-gold font-bold">Departure: </span>
              <span className="text-[--fg-2]">{fmtDate(ev.departureDate)} · {fmtTime(ev.departureDate)}</span>
            </div>
          )}
          {ev.distance && (
            <div className="text-xs font-mono">
              <span className="text-gold font-bold">Distance: </span>
              <span className="text-[--fg-2]">{ev.distance} km</span>
            </div>
          )}
          {ev.map && (
            <img src={ev.map} alt="route map" className="w-full rounded-lg mt-2 max-h-40 object-cover" />
          )}
        </div>
      )}

      <div className="text-[10px] text-[--fg-3] mt-2 text-right">{open ? '▲ less' : '▼ more'}</div>
    </div>
  );
}

function transformVtcEvent(e: any): TNLEvent | null {
  const id    = String(e.id ?? e._id ?? '');
  const title = e.name ?? e.title ?? '';
  const date  = e.start_at ?? e.startDate ?? '';
  if (!id || !title || !date) return null;
  const server = typeof e.server === 'object' ? (e.server?.name ?? 'Unknown') : (e.server ?? 'Unknown');
  const route  = e.route ?? (e.departure?.city && e.arrive?.city ? `${e.departure.city} → ${e.arrive.city}` : 'Unknown Route');
  return {
    _id: id, title, startDate: date,
    departureDate: e.meetup_at ?? undefined,
    server, route,
    banner: e.banner ?? undefined, map: e.map ?? undefined,
    distance: e.distance ?? undefined,
    attendances: e.attendances ?? undefined,
    slots: e.slots ?? undefined,
    source: 'truckersmp',
  };
}

type Filter = 'all' | 'tnl' | 'other';

export function EventsPage() {
  const { token } = useAuthStore();
  const [events, setEvents] = useState<TNLEvent[]>(() => {
    try { const r = localStorage.getItem(CACHE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [loading, setLoading] = useState(events.length === 0);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState<Filter>('all');

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear,  setViewYear]  = useState(now.getFullYear());

  const sync = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [tnlRes, vtcRes] = await Promise.allSettled([
        fetch(TNL_API, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(VTC_API),
      ]);

      const tnlEvents: TNLEvent[] = [];
      if (tnlRes.status === 'fulfilled' && tnlRes.value.ok) {
        const data = await tnlRes.value.json();
        const raw: any[] = Array.isArray(data) ? data : (data.response ?? data.events ?? data.data ?? []);
        raw.forEach(e => tnlEvents.push({
          ...e,
          startDate: e.startDate ?? e.date ?? e.start_date ?? '',
          departureDate: e.departureDate ?? e.departure_date ?? e.meetup_at ?? '',
          source: 'tnl' as const,
        }));
      }

      const vtcEvents: TNLEvent[] = [];
      if (vtcRes.status === 'fulfilled' && vtcRes.value.ok) {
        const data = await vtcRes.value.json();
        const raw: any[] = Array.isArray(data) ? data : (data.response ?? []);
        raw.forEach(e => { const t = transformVtcEvent(e); if (t) vtcEvents.push(t); });
      }

      const tnlKeys = new Set(tnlEvents.map(dedupKey));
      const merged = [...tnlEvents, ...vtcEvents.filter(e => !tnlKeys.has(dedupKey(e)))];
      merged.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      setEvents(merged);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(merged)); } catch {}
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (events.length === 0) sync(); }, []);

  function shiftMonth(delta: number) {
    setViewMonth(m => {
      const total = m + delta;
      const newYear = viewYear + Math.floor(total / 12);
      const newMonth = ((total % 12) + 12) % 12;
      setViewYear(newYear);
      return newMonth;
    });
  }

  const filtered = useMemo(() => {
    let list = events;
    if (filter === 'tnl')   list = list.filter(e => e.source === 'tnl');
    if (filter === 'other') list = list.filter(e => e.source === 'truckersmp');
    return list;
  }, [events, filter]);

  const isCurrentMonth = viewMonth === now.getMonth() && viewYear === now.getFullYear();

  const happeningToday = useMemo(() =>
    isCurrentMonth ? filtered.filter(e => !isPast(e.departureDate || e.startDate) && isToday(e.startDate)) : [],
    [filtered, isCurrentMonth]);

  const upcomingRuns = useMemo(() =>
    filtered.filter(e =>
      !isPast(e.startDate) &&
      !happeningToday.some(h => h._id === e._id) &&
      inMonth(e.startDate, viewMonth, viewYear)
    ),
    [filtered, happeningToday, viewMonth, viewYear]);

  const FILTER_LABELS: Record<Filter, string> = { all: 'All', tnl: 'TNL', other: 'Other' };

  return (
    <div className="px-5 py-6">
      {/* Header */}
      <div className="mb-5">
        <p className="eyebrow mb-1">Convoys & Events</p>
        <div className="flex items-end justify-between">
          <h1 className="font-display text-4xl text-white">Upcoming runs</h1>
          <button onClick={sync} disabled={loading}
                  className="px-4 py-2 bg-gold/10 border border-[--bd-gold] rounded-lg text-gold text-xs font-semibold active:scale-95 transition-transform disabled:opacity-40">
            {loading ? '...' : '🔄 Sync'}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {/* Month nav + filter */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => shiftMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-full border border-soft text-[--fg-2] active:scale-95 text-lg">‹</button>
        <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-gold' : 'text-white'}`}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={() => shiftMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-full border border-soft text-[--fg-2] active:scale-95 text-lg">›</button>
      </div>

      <div className="flex gap-2 mb-5">
        {(['all', 'tnl', 'other'] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
                  className={`pill ${filter === f ? 'pill-active' : 'pill-inactive'}`}>
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Skeletons */}
      {loading && (
        <>
          <div className="card border-[--bd-gold] mb-4">
            <div className="skeleton w-full h-40 rounded-lg mb-3" />
            <div className="skeleton w-[30%] h-2.5 mb-2" />
            <div className="skeleton w-[65%] h-4 mb-2" />
            <div className="skeleton w-[40%] h-3" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card mb-3">
              <div className="flex justify-between mb-2"><div className="skeleton w-[55%] h-3.5" /><div className="skeleton w-[20%] h-3.5" /></div>
              <div className="skeleton w-[35%] h-2.5" />
            </div>
          ))}
        </>
      )}

      {!loading && (
        <>
          {/* Happening Today */}
          {happeningToday.length > 0 && (
            <div className="mb-2">
              <p className="eyebrow mb-3">Happening Today</p>
              {happeningToday.map(ev => <FeaturedCard key={ev._id} ev={ev} />)}
            </div>
          )}

          {/* Upcoming Runs */}
          {upcomingRuns.length > 0 && (
            <div>
              <p className="eyebrow mb-3">
                Upcoming Runs — {MONTHS[viewMonth].toUpperCase()} {viewYear}
              </p>
              {upcomingRuns.map(ev => <EventCard key={ev._id} ev={ev} />)}
            </div>
          )}

          {happeningToday.length === 0 && upcomingRuns.length === 0 && (
            <p className="text-sm text-[--fg-3] text-center mt-12">
              No events in {MONTHS[viewMonth]} {viewYear}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
