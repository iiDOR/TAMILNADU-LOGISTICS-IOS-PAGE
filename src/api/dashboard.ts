import { API_URL as BASE, WISP_URL } from '../config';

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
  const res = await fetch(`${WISP_URL}/api/public/jobs?tmp_id=${tmpId}&size=1000`);
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
