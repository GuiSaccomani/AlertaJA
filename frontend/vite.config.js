import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// O backend ASP.NET não possui CORS e usa certificado de desenvolvimento.
// O proxy do Vite repassa /api para a API, resolvendo os dois pontos.
const target = process.env.VITE_API_TARGET || 'https://localhost:7275'

const proxy = {
  '/api': { target, secure: false, changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, proxy },
})
