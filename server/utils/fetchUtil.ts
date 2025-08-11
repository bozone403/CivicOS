export async function fetchWithTimeoutRetry(url: string, options: RequestInit & { timeoutMs?: number; retries?: number; backoffMs?: number } = {}): Promise<Response> {
  const { timeoutMs = 10000, retries = 2, backoffMs = 500, ...rest } = options;
  let attempt = 0;
  let lastError: any;
  while (attempt <= retries) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...rest, signal: controller.signal });
      clearTimeout(t);
      return res;
    } catch (err) {
      clearTimeout(t);
      lastError = err;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, attempt)));
      attempt++;
    }
  }
  throw lastError;
}


