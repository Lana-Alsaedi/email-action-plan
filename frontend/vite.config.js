import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'extension' ? '/' : '/email-action-plan/',
}))
