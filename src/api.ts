import { env } from './config'

export type Product = { id: number; name: string; description: string; price: number; stock: number }
export type Order = {
  id: number
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
  ) {
    super(message)
  }
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
    throw new ApiError(res.status, body?.detail ?? body?.message ?? res.statusText)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}
