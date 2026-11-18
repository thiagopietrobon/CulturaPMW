import { createRouter, createWebHistory } from 'vue-router'
import PublicLayout from '../components/layout/PublicLayout.vue'
import HomeView from '../views/public/HomeView.vue'
import EventoDetalhesView from '../views/public/EventoDetalhesView.vue'
import ProdutorPerfilView from '../views/public/ProdutorPerfilView.vue'
import CadastroProdutorView from '../views/auth/CadastroProdutorView.vue'
import LoginView from '../views/auth/LoginView.vue'
import RecuperacaoSenhaView from '../views/auth/RecuperacaoSenhaView.vue'
import RedefinirSenhaView from '../views/auth/RedefinirSenhaView.vue'
import AguardandoAprovacaoView from '../views/produtor/AguardandoAprovacaoView.vue'
import PainelProdutorView from '../views/produtor/PainelProdutorView.vue'
import PerfilProdutorView from '../views/produtor/PerfilProdutorView.vue'
import StatusProdutorView from '../views/produtor/StatusProdutorView.vue'
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
    { path: '/produtor/cadastro', name: 'produtor-cadastro', component: CadastroProdutorView, meta: { guestOnlyProducer: true } },
    { path: '/produtor/login', name: 'produtor-login', component: LoginView, meta: { guestOnlyProducer: true } },
    { path: '/produtor/recuperar-senha', name: 'produtor-recuperar-senha', component: RecuperacaoSenhaView },
    { path: '/produtor/redefinir-senha', name: 'produtor-redefinir-senha', component: RedefinirSenhaView },
    {
      path: '/produtor/aguardando-aprovacao',
      name: 'produtor-status',
      component: AguardandoAprovacaoView,
      meta: { requiresProducer: true, allowedProducerStatuses: ['AGUARDANDO_APROVACAO'] }
    },
    {
      path: '/produtor/reprovado',
      name: 'produtor-reprovado',
      component: StatusProdutorView,
      meta: { requiresProducer: true, allowedProducerStatuses: ['REPROVADO'] }
    },
    {
      path: '/produtor/suspenso',
      name: 'produtor-suspenso',
      component: StatusProdutorView,
      meta: { requiresProducer: true, allowedProducerStatuses: ['SUSPENSO'] }
    },
    {
      path: '/produtor/painel',
      name: 'produtor-painel',
      component: PainelProdutorView,
      meta: { requiresProducer: true, requiresApprovedProducer: true }
    },
    {
      path: '/produtor/perfil',
      name: 'produtor-perfil-edicao',
      component: PerfilProdutorView,
      meta: { requiresProducer: true }
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

function destinoStatusProdutor(status: string): { name: string } {
  if (status === 'AGUARDANDO_APROVACAO') return { name: 'produtor-status' }
  if (status === 'REPROVADO') return { name: 'produtor-reprovado' }
  if (status === 'SUSPENSO') return { name: 'produtor-suspenso' }
  return { name: 'produtor-painel' }
}

router.beforeEach(async (to) => {
  if (to.meta.requiresAdmin || to.meta.guestOnlyAdmin) {
    try {
      const administrador = await authService.administradorAtual()
      if (to.meta.requiresAdmin && !administrador) {
        return { name: 'admin-login', query: { redirect: to.fullPath } }
      }
      if (to.meta.guestOnlyAdmin && administrador) return { name: 'admin-dashboard' }
    } catch (error) {
      console.error('Não foi possível validar a sessão administrativa:', error)
      if (to.meta.requiresAdmin) return { name: 'admin-login' }
    }
  }

  if (to.meta.requiresProducer || to.meta.guestOnlyProducer) {
    try {
      const produtor = await authService.produtorAtual()
      if (to.meta.requiresProducer && !produtor) {
        return { name: 'produtor-login', query: { redirect: to.fullPath } }
      }
      if (to.meta.guestOnlyProducer && produtor) return destinoStatusProdutor(produtor.status)
      if (to.meta.requiresProducer && produtor) {
        const statusPermitidos = to.meta.allowedProducerStatuses as string[] | undefined
        if (statusPermitidos && !statusPermitidos.includes(produtor.status)) {
          return destinoStatusProdutor(produtor.status)
        }
        if (to.meta.requiresApprovedProducer && produtor.status !== 'APROVADO') {
          return destinoStatusProdutor(produtor.status)
        }
      }
    } catch (error) {
      console.error('Não foi possível validar a sessão do produtor:', error)
      if (to.meta.requiresProducer) return { name: 'produtor-login' }
    }
  }
})

export default router
