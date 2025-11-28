export const ORCH_URL = (import.meta.env.VITE_ORCH_URL as string) || 'http://127.0.0.1:7333';

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ORCH_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init && init.headers),
    } as any,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error('Request failed'), { data, status: res.status });
  return data as T;
}

export function stream(path: string): EventSource {
  return new EventSource(`${ORCH_URL}${path}`);
}



