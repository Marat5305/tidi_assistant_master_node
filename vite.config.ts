import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  publicDir: './src/assets',
  server: {
    strictPort: true,
    port: 8005,
  },
  preview: {
    strictPort: true,
    port: 8005
  }

})