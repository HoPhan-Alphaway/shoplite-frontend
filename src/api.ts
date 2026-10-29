import { env } from './config'

export type Product = { id: number; name: string; description: string; price: number; stock: number }
export type Order = {
  id: number
  productId: number
  productName: string
  quantity: number
  totalAmount: number
  status: string
  createdAt: string
}
export type Notification = { id: number; channel: string; message: string; createdAt: string }
export type Profile = {
  username: string
  email: string
  fullName: string
  phone: string | null
  address: string | null
  groups: string[]
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** The server asked for the same request to be retried (Retry-After), e.g. 409 in progress. */
    public retryable = false,
  ) {
    super(message)
  }
}

/** One key per logical order intent: retries and double clicks must send the same value. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Every call goes through Kong. The access token is attached when the user is logged in. */
export async function api<T>(path: string, token?: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(env.API_BASE_URL + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(
      res.status,
      body?.detail ?? body?.message ?? res.statusText,
      res.headers.has('Retry-After'),
    )
  }
  return res.status === 204 ? (undefined as T) : res.json()
}
