import { useCallback, useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { api, ApiError, type Notification, type Order, type Product, type Profile } from './api'

type Tab = 'products' | 'orders' | 'notifications' | 'profile' | 'admin'

function roles(profile: unknown): string[] {
  return ((profile as { realm_access?: { roles?: string[] } })?.realm_access?.roles ?? []) as string[]
}

export default function App() {
  const auth = useAuth()
  const [tab, setTab] = useState<Tab>('products')
  const token = auth.user?.access_token
  // realm roles live in the access token, not the ID token: decode its payload for UI decisions only.
  const tokenClaims = token ? JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) : null
  const isAdmin = roles(tokenClaims).includes('admin')

  if (auth.isLoading) return <p className="center">Loading…</p>
  if (auth.error) return <p className="center error">Auth error: {auth.error.message}</p>

  return (
    <div className="app">
      <header>
        <h1>ShopLite</h1>
        <nav>
          <button onClick={() => setTab('products')}>Products</button>
          {auth.isAuthenticated && (
            <>
              <button onClick={() => setTab('orders')}>My orders</button>
              <button onClick={() => setTab('notifications')}>Notifications</button>
              <button onClick={() => setTab('profile')}>Profile</button>
              {isAdmin && <button onClick={() => setTab('admin')}>Admin</button>}
            </>
          )}
        </nav>
        <div>
          {auth.isAuthenticated ? (
            <>
              <span className="muted">{auth.user?.profile.preferred_username}</span>{' '}
              <button onClick={() => auth.signoutRedirect()}>Logout</button>
            </>
          ) : (
            <button className="primary" onClick={() => auth.signinRedirect()}>
              Login with Keycloak
            </button>
          )}
        </div>
      </header>
      <main>
        {tab === 'products' && <Products token={token} />}
        {tab === 'orders' && token && <Orders token={token} />}
        {tab === 'notifications' && token && <Notifications token={token} />}
        {tab === 'profile' && token && <ProfilePage token={token} />}
        {tab === 'admin' && token && <Admin token={token} />}
      </main>
    </div>
  )
}

function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(() => {
    load().then(setData, (e: Error) => setError(e.message))
  }, [load])
  useEffect(reload, [reload])
  return { data, error, reload }
}

function Products({ token }: { token?: string }) {
  const load = useCallback(() => api<Product[]>('/api/products'), [])
  const { data, error, reload } = useLoad(load)
  const [message, setMessage] = useState<string | null>(null)

  async function buy(p: Product) {
    setMessage(null)
    try {
      const order = await api<Order>('/api/orders', token, {
        method: 'POST',
        body: JSON.stringify({ productId: p.id, quantity: 1 }),
      })
      setMessage(`Order #${order.id} placed: ${order.productName} ($${order.totalAmount})`)
      reload()
    } catch (e) {
      const err = e as ApiError
      setMessage(`Order failed (${err.status}): ${err.message}`)
    }
  }

  if (error) return <p className="error">{error}</p>
  return (
    <>
      {message && <p className="notice">{message}</p>}
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Stock</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data?.map((p) => (
            <tr key={p.id}>
              <td>
                <b>{p.name}</b>
                <div className="muted">{p.description}</div>
              </td>
              <td>${p.price}</td>
              <td>{p.stock}</td>
              <td>
                <button disabled={!token || p.stock === 0} onClick={() => buy(p)}>
                  {token ? 'Buy 1' : 'Login to buy'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Orders({ token }: { token: string }) {
  const load = useCallback(() => api<Order[]>('/api/orders', token), [token])
  const { data, error } = useLoad(load)
  if (error) return <p className="error">{error}</p>
  if (data?.length === 0) return <p className="muted">No orders yet.</p>
  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Product</th>
          <th>Qty</th>
          <th>Total</th>
          <th>Status</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((o) => (
          <tr key={o.id}>
            <td>{o.id}</td>
            <td>{o.productName}</td>
            <td>{o.quantity}</td>
            <td>${o.totalAmount}</td>
            <td>{o.status}</td>
            <td>{new Date(o.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Notifications({ token }: { token: string }) {
  const load = useCallback(() => api<Notification[]>('/api/notifications', token), [token])
  const { data, error, reload } = useLoad(load)
  if (error) return <p className="error">{error}</p>
  return (
    <>
      <p className="muted">
        Delivered asynchronously via Kafka — may lag a moment behind the order.{' '}
        <button onClick={reload}>Refresh</button>
      </p>
      <ul>
        {data?.map((n) => (
          <li key={n.id}>
            <span className="tag">{n.channel}</span> {n.message}{' '}
            <span className="muted">{new Date(n.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function ProfilePage({ token }: { token: string }) {
  const load = useCallback(() => api<Profile>('/api/users/me', token), [token])
  const { data, error } = useLoad(load)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) {
      setPhone(data.phone ?? '')
      setAddress(data.address ?? '')
    }
  }, [data])

  async function save() {
    await api('/api/users/me', token, { method: 'PUT', body: JSON.stringify({ phone, address }) })
    setSaved(true)
  }

  if (error) return <p className="error">{error}</p>
  if (!data) return null
  return (
    <div className="form">
      <p>
        <b>{data.fullName}</b> ({data.username}) — {data.email}
      </p>
      <p className="muted">Groups: {data.groups.join(', ') || '—'}</p>
      <label>
        Phone <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label>
        Address <input value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>
      <button className="primary" onClick={save}>
        Save
      </button>
      {saved && <span className="muted"> Saved.</span>}
    </div>
  )
}

function Admin({ token }: { token: string }) {
  const [form, setForm] = useState({ name: '', description: '', price: '10', stock: '10' })
  const [message, setMessage] = useState<string | null>(null)

  async function create() {
    try {
      const p = await api<Product>('/api/products', token, {
        method: 'POST',
        body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }),
      })
      setMessage(`Created product #${p.id}`)
    } catch (e) {
      const err = e as ApiError
      setMessage(`Failed (${err.status}): ${err.message}`)
    }
  }

  return (
    <div className="form">
      <h3>New product (role: admin)</h3>
      {(['name', 'description', 'price', 'stock'] as const).map((field) => (
        <label key={field}>
          {field} <input value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} />
        </label>
      ))}
      <button className="primary" onClick={create}>
        Create
      </button>
      {message && <p className="notice">{message}</p>}
    </div>
  )
}
