import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Tauri dev server 需要固定端口
  server: {
    port: 5173,
    strictPort: true,
  },
  // 构建输出到 dist（Tauri 前端资源）
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  // 环境变量前缀
  envPrefix: ['VITE_'],
})
