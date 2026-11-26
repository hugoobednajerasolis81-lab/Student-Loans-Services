let cachedToken = "";
let tokenExpiresAt = 0;

function config() {
  const url = process.env.POCKETBASE_URL?.trim();
  const email = process.env.POCKETBASE_SERVICE_EMAIL?.trim();
  const password = process.env.POCKETBASE_SERVICE_PASSWORD;
  if (!url || !email || !password) {
    throw new Error("PocketBase server credentials are not configured.");
  }
  return { url: url.replace(/\/+$/, ""), email, password };
}

async function serviceToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
  const { url, email, password } = config();
  const response = await fetch(`${url}/api/collections/users/auth-with-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identity: email, password }),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("PocketBase service authentication failed.");
  const result = await response.json() as { token?: string; record?: { role?: string } };
  if (!result.token || result.record?.role !== "admin") {
    throw new Error("The configured PocketBase service account must have the admin role.");
  }
  cachedToken = result.token;
  tokenExpiresAt = Date.now() + 8 * 60 * 60 * 1000;
  return cachedToken;
}

export async function pbServer<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { url } = config();
  const token = await serviceToken();
  const response = await fetch(`${url}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: token,
      ...(init.headers || {})
    },
    cache: "no-store"
  });
  if (!response.ok) {
    if (response.status === 401) {
      cachedToken = "";
      tokenExpiresAt = 0;
    }
    const message = response.status === 404 ? "The requested PocketBase record was not found." : "PocketBase request failed.";
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export async function createPublicLead(input: {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  consent: boolean;
}) {
  return pbServer("api/collections/leads/records", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      phone: input.phone || "",
      loan_type: input.topic,
      balance: "",
      message: input.message,
      status: "New",
      consent: input.consent
    })
  });
}

export async function findAgreementByToken(token: string) {
  const filter = encodeURIComponent(`token = "${token}"`);
  const result = await pbServer<{ items: Record<string, unknown>[] }>(
    `api/collections/agreements/records?filter=${filter}&perPage=1&expand=lead`
  );
  return result.items?.[0] ?? null;
}
