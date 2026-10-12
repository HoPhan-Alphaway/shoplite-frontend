# shoplite-frontend

React + Vite + TypeScript. Login bằng Keycloak (OIDC Authorization Code + PKCE, `react-oidc-context`), gọi API qua Kong với Bearer token.

- Dev: `npm install && npm run dev` → http://localhost:5173 (cần stack local đang chạy).
- Image: nginx-unprivileged (port 8080, non-root). Runtime config sinh ra `/env.js` từ env var lúc container start → 1 image dùng cho mọi môi trường.

Env (container): `OIDC_AUTHORITY`, `OIDC_CLIENT_ID`, `API_BASE_URL` (rỗng = cùng origin).
