const TOKEN_KEY = 'admission_crm_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function parseJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const token = options.token ?? getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;

  const res = await fetch(path.startsWith('http') ? path : `/api${path}`, {
    ...options,
    headers,
  });
  const data = await parseJson(res);
  if (!res.ok) {
    const msg = typeof data === 'object' && data && 'message' in data ? String((data as { message: string }).message) : res.statusText;
    throw new Error(msg || 'Request failed');
  }
  return data as T;
}
