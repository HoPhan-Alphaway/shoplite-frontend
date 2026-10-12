import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `npm run dev` on :5173 calls the API through Kong (see public/env.js).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
})
