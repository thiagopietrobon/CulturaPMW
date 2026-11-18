import { createRouter, createWebHistory } from 'vue-router'
import PublicLayout from '../components/layout/PublicLayout.vue'
import HomeView from '../views/public/HomeView.vue'
import EventoDetalhesView from '../views/public/EventoDetalhesView.vue'
import ProdutorPerfilView from '../views/public/ProdutorPerfilView.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import AdminLoginView from '../views/admin/AdminLoginView.vue'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'
import AdminProdutoresView from '../views/admin/AdminProdutoresView.vue'
import AdminEventosView from '../views/admin/AdminEventosView.vue'
import AdminCategoriasView from '../views/admin/AdminCategoriasView.vue'
import { authService } from '../services/AuthService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: PublicLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'eventos/:id', name: 'evento-detalhes', component: EventoDetalhesView },
        { path: 'produtores/:id', name: 'produtor-perfil', component: ProdutorPerfilView }
      ]
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLoginView,
      meta: { guestOnlyAdmin: true }
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAdmin: true },
      children: [
        { path: '', name: 'admin-dashboard', component: AdminDashboardView },
        { path: 'produtores', name: 'admin-produtores', component: AdminProdutoresView },
        { path: 'eventos', name: 'admin-eventos', component: AdminEventosView },
        { path: 'categorias', name: 'admin-categorias', component: AdminCategoriasView }
      ]
    }
  ]
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAdmin || to.meta.guestOnlyAdmin) {
    try {
      const administrador = await authService.administradorAtual()
      if (to.meta.requiresAdmin && !administrador) {
        return { name: 'admin-login', query: { redirect: to.fullPath } }
      }
      if (to.meta.guestOnlyAdmin && administrador) {
        return { name: 'admin-dashboard' }
      }
    } catch (error) {
      console.error('Não foi possível validar a sessão administrativa:', error)
      if (to.meta.requiresAdmin) return { name: 'admin-login' }
    }
  }
})

export default router
