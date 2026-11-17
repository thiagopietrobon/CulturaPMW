import { createRouter, createWebHistory } from 'vue-router'
import PublicLayout from '../components/layout/PublicLayout.vue'
import HomeView from '../views/public/HomeView.vue'
import EventoDetalhesView from '../views/public/EventoDetalhesView.vue'
import ProdutorPerfilView from '../views/public/ProdutorPerfilView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: PublicLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomeView
        },
        {
          path: 'eventos/:id',
          name: 'evento-detalhes',
          component: EventoDetalhesView
        },
        {
          path: 'produtores/:id',
          name: 'produtor-perfil',
          component: ProdutorPerfilView
        }
      ]
    }
  ]
})

export default router