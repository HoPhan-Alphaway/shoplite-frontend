import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { WebStorageStateStore } from 'oidc-client-ts'
import { env } from './config'
import App from './App'
import './styles.css'

// OIDC Authorization Code flow + PKCE (oidc-client-ts does PKCE automatically).
const oidcConfig = {
  authority: env.OIDC_AUTHORITY,
  client_id: env.OIDC_CLIENT_ID,
  redirect_uri: window.location.origin + '/',
  post_logout_redirect_uri: window.location.origin + '/',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  // Remove ?code=...&state=... from the URL after login.
  onSigninCallback: () => window.history.replaceState({}, document.title, window.location.pathname),
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
