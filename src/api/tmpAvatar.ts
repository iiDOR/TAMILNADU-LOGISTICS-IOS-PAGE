const cache = new Map<string, string>();

export async function getTmpAvatar(tmpId: string): Promise<string> {
  if (cache.has(tmpId)) return cache.get(tmpId)!;
  try {
    const res = await fetch(`https://tnl.wispbyte.app/api/tmp/player/${tmpId}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const url: string = data?.response?.avatar ?? '';
    cache.set(tmpId, url);
    return url;
  } catch {
    cache.set(tmpId, '');
    return '';
  }
}
