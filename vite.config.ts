import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.API_PROXY_TARGET ?? 'http://localhost:3000'
  const apiProxyOrigin = env.API_PROXY_ORIGIN

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // `VITE_API_BASE_URL=/` leaves generated `/v1` endpoints for this proxy.
        '/v1': {
          target: apiProxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            if (!apiProxyOrigin) {
              return
            }

            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Origin', apiProxyOrigin)
            })
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      css: true,
      testTimeout: 15000,
    },
  }
})
