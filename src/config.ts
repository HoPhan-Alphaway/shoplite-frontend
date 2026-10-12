type RuntimeEnv = {
  OIDC_AUTHORITY: string
  OIDC_CLIENT_ID: string
  API_BASE_URL: string
}

declare global {
  interface Window {
    __ENV__: RuntimeEnv
  }
}

export const env: RuntimeEnv = window.__ENV__
