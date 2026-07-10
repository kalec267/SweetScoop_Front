import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // 💡 라우터 가져오기 (index.js 생략 가능)

const app = createApp(App)

app.use(router) // 💡 중요: Vue 인스턴스에 라우터 장착하기

app.mount('#app')