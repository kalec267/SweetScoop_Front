import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router' // 우리가 만든 router/index.js 임포트

const app = createApp(App)

app.use(createPinia())
app.use(router) // ⭐️ 이 부분이 누락되면 <router-view />가 작동하지 않아 화면이 하얗게 뜹니다!

app.mount('#app')