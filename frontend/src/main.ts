import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. Import Pinia
import App from './App.vue'
import router from './router' // 2. Import router kita
import './style.css'

const app = createApp(App)
const pinia = createPinia() // 3. Buat instance Pinia

app.use(pinia) // 4. Gunakan Pinia
app.use(router) // 5. Gunakan Router

app.mount('#app')