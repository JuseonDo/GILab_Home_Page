// client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal'

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined
      ? [await import('@replit/vite-plugin-cartographer').then(m => m.cartographer())]
      : []),
  ],
  resolve: {
    alias: {
      '@':       path.resolve(import.meta.dirname, 'src'),
      '@shared': path.resolve(import.meta.dirname, 'src', 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'src', 'assets'), // public을 쓰면 'public'로
    },
  },
  // root는 기본이 현재 디렉터리(client)라서 명시 불필요
  build: {
    outDir: 'dist',      // client/dist 로 산출
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://gilab_backend:8000',
        changeOrigin: true,
        // ★ 중요: 백엔드가 /api 프리픽스가 없으므로 /api를 제거
        rewrite: p => p.replace(/^\/api/, ''),
        // 리다이렉트 절대 URL 생성 시 호스트/포트가 유지되도록
        configure: (proxy) => { proxy.options.xfwd = true; },
      }
    }
  }
})