import { WISP_URL } from '../config';
const JOBS_URL = `${WISP_URL}/api/public/jobs`;

export async function apiGetMyJobs(tmpId: string): Promise<any[]> {
  const res = await fetch(`${JOBS_URL}?tmp_id=${tmpId}&size=1000`);
  if (!res.ok) throw new Error('Failed to load jobs');
  const data = await res.json();
  const all: any[] = data?.jobs ?? [];
  return all.sort((a, b) => (b.realtime?.end ?? 0) - (a.realtime?.end ?? 0));
}

export async function apiGetAllJobs(): Promise<any[]> {
  const res = await fetch(`${JOBS_URL}?size=1000`);
  if (!res.ok) throw new Error('Failed to load fleet jobs');
  const data = await res.json();
  return (data?.jobs ?? []).sort((a: any, b: any) => (b.realtime?.end ?? 0) - (a.realtime?.end ?? 0));
}
