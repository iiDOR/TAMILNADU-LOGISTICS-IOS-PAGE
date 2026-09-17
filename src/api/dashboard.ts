const BASE = import.meta.env.VITE_API_URL ?? 'https://api.tamilnadulogistics.in';
const JOBS_URL = 'https://tnl.wispbyte.app/api/public/jobs?size=1000';

export interface DashboardData {
  user: any;
  rider: any;
  progress: any[];
  completions: any[];
  totals: any;
  attendance: any;
  achievements: any[];
  wallet: any;
  truckershubStats: any;
}

export async function apiGetUserJobs(tmpId: string): Promise<any[]> {
  const res = await fetch(`https://tnl.wispbyte.app/api/public/jobs?tmp_id=${tmpId}&size=1000`);
  if (!res.ok) throw new Error('Failed to load jobs');
  const data = await res.json();
  const all: any[] = data?.jobs ?? [];
  return all.sort((a: any, b: any) => (b.realtime?.end ?? 0) - (a.realtime?.end ?? 0));
}

export async function apiGetDashboard(token: string): Promise<DashboardData> {
  const res = await fetch(`${BASE}/api/me/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) throw new Error('Failed to load dashboard');
  return res.json();
}
