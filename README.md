# shoplite-frontend

React + Vite + TypeScript. Login bằng Keycloak (OIDC Authorization Code + PKCE, `react-oidc-context`), gọi API qua Kong với Bearer token.

- Dev: `npm install && npm run dev` → http://localhost:5173 (cần stack local đang chạy).
- `Buy 1` giữ một `Idempotency-Key` trong `sessionStorage` cho mỗi product: double click, retry mạng hay reload tab đều gửi lại đúng key đó nên chỉ tạo một order. Key được xoá khi server trả kết quả dứt điểm (201, 400, 404, 409 hết hàng, 422); khi nhận 202/409-in-progress thì giữ lại để retry hỏi tiếp đơn đang xử lý.
- Image: nginx-unprivileged (port 8080, non-root). Runtime config sinh ra `/env.js` từ env var lúc container start → 1 image dùng cho mọi môi trường.

Env (container): `OIDC_AUTHORITY`, `OIDC_CLIENT_ID`, `API_BASE_URL` (rỗng = cùng origin).
