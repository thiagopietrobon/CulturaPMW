import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import './composables/useTema'
import { instalarEfeitoToque } from './composables/useToque'

createApp(App)
  .use(router)
  .mount('#app')

instalarEfeitoToque()
