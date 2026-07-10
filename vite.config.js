import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url' // 💡 경로 설정을 위해 추가

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 💡 이제 프로젝트 어디서든 '@/'를 쓰면 'src/' 폴더를 가리키게 됩니다.
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})