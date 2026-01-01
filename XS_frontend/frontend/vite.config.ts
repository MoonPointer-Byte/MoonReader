import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    port: 5173, // 前端端口
    proxy: {
      // 匹配 /api 开头的请求
      '/api': {
        target: 'http://localhost:8080', // 后端地址
        changeOrigin: true,
        // 如果后端接口本身不带 /api 前缀，需要在这里 rewrite 去掉
        // 根据你的文档，你的接口 URL 是 /api/auth/login，所以不需要 rewrite
        // rewrite: (path) => path.replace(/^\/api/, '') 
      },
      // WebSocket 代理
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/files': { // 假设你的图片路径以 /files 开头
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})