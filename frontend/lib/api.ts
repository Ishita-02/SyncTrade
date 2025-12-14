const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`);
  if (!res.ok) throw new Error("API error");
  return res.json();
}
