const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

type ApiOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: HeadersInit;
};

export async function api<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API error");
  }

  return res.json();
}
