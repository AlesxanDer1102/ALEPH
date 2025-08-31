// Lightweight fetch client with sane defaults
// Usage: apiFetch<T>("/otp/request", { method: "POST", body: payload })
const DEFAULT_TIMEOUT_MS = 15000;

// Safe env accessor (mirrors style in config.ts)
const getEnvVar = (key: string, fallback: string = ""): string => {
  if (typeof window !== "undefined") {
    return (process.env as any)[`NEXT_PUBLIC_${key}`] || fallback;
  }
  return process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || fallback;
};

export const API_BASE_URL =
  getEnvVar("API_BASE_URL", "http://localhost:8000").replace(/\/$/, "");

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text || null;
  }
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    // Pass plain JS object; it will be JSON.stringified
    body?: unknown;
    headers?: Record<string, string>;
    timeoutMs?: number;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const compositeSignal = signal
    ? new AbortController()
    : null;
  if (compositeSignal) {
    signal.addEventListener("abort", () => compositeSignal.abort());
    controller.signal.addEventListener("abort", () => compositeSignal.abort());
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: compositeSignal ? compositeSignal.signal : controller.signal,
    cache: "no-store",
  }).catch((err) => {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      const e: ApiError = { status: 0, message: "Request timed out" };
      throw e;
    }
    const e: ApiError = { status: 0, message: err?.message || "Network error" };
    throw e;
  });

  clearTimeout(timer);

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const e: ApiError = {
      status: res.status,
      message:
        (data && (data.detail || data.message)) ||
        `HTTP ${res.status}`,
      details: data,
    };
    throw e;
  }

  return data as T;
}
