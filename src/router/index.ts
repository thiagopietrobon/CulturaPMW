
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
import MeusEventosView from '../views/produtor/MeusEventosView.vue'
import FormularioEventoView from '../views/produtor/FormularioEventoView.vue'
import AdminLayout from '../views/admin/AdminLayout.vue'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'
import AdminProdutoresView from '../views/admin/AdminProdutoresView.vue'
import AdminEventosView from '../views/admin/AdminEventosView.vue'
import AdminCategoriasView from '../views/admin/AdminCategoriasView.vue'
import { authService } from '../services/AuthService'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  // Volta ao topo depois que a página anterior terminou de sair (transição),
  // mantém a posição ao usar voltar/avançar e rola suave até âncoras (#).
  scrollBehavior(to, from, posicaoSalva) {
    if (posicaoSalva) return posicaoSalva
    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 90 }
    if (to.path === from.path) return false
    return new Promise((resolve) => {
      window.setTimeout(() => resolve({ top: 0 }), 170)
    })
  },

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
      path: '/produtor/cadastro',
      name: 'produtor-cadastro',
      component: CadastroProdutorView,
      meta: {
        guestOnly: true,
        transition: 'auth'
      }
    },

    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        guestOnly: true,
        transition: 'auth'
      }
    },

    // Compatibilidade com os endereços antigos.
    { path: '/produtor/login', redirect: (to) => ({ name: 'login', query: to.query }) },
    { path: '/admin/login', redirect: (to) => ({ name: 'login', query: to.query }) },

    {
      path: '/produtor/recuperar-senha',
      name: 'produtor-recuperar-senha',
      component: RecuperacaoSenhaView,
      meta: { transition: 'auth' }
    },

    {
      path: '/produtor/redefinir-senha',
      name: 'produtor-redefinir-senha',
      component: RedefinirSenhaView,
      meta: { transition: 'auth' }
    },

    {
      path: '/produtor/aguardando-aprovacao',
      name: 'produtor-status',
      component: AguardandoAprovacaoView,
      meta: {
        requiresProducer: true,
        allowedProducerStatuses: ['AGUARDANDO_APROVACAO']
      }
    },

    {
      path: '/produtor/reprovado',
      name: 'produtor-reprovado',
      component: StatusProdutorView,
      meta: {
        requiresProducer: true,
        allowedProducerStatuses: ['REPROVADO']
      }
    },

    {
      path: '/produtor/suspenso',
      name: 'produtor-suspenso',
      component: StatusProdutorView,
      meta: {
        requiresProducer: true,
        allowedProducerStatuses: ['SUSPENSO']
      }
    },

    {
      path: '/produtor',
      redirect: { name: 'produtor-painel' }
    },

    {
      path: '/produtor/painel',
      name: 'produtor-painel',
      component: PainelProdutorView,
      meta: {
        requiresProducer: true,
        requiresApprovedProducer: true
      }
    },

    {
      path: '/produtor/perfil',
      name: 'produtor-perfil-edicao',
      component: PerfilProdutorView,
      meta: { requiresProducer: true }
    },

    {
      path: '/produtor/eventos',
      name: 'produtor-eventos',
      component: MeusEventosView,
      meta: {
        requiresProducer: true,
        requiresApprovedProducer: true
      }
    },

    {
      path: '/produtor/eventos/novo',
      name: 'produtor-evento-novo',
      component: FormularioEventoView,
      meta: {
        requiresProducer: true,
        requiresApprovedProducer: true
      }
    },

    {
      path: '/produtor/eventos/:id/editar',
      name: 'produtor-evento-editar',
      component: FormularioEventoView,
      meta: {
        requiresProducer: true,
        requiresApprovedProducer: true
      }
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
  if (to.meta.requiresAdmin) {
    try {
      const administrador = await authService.administradorAtual()

      if (!administrador) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    } catch (error) {
      console.error('Não foi possível validar a sessão administrativa:', error)
      return { name: 'login' }
    }
  }

  if (to.meta.guestOnly) {
    try {
      const usuario = await authService.usuarioAtual()

      if (usuario?.role === 'admin') {
        return { name: 'admin-dashboard' }
      }

      if (usuario?.role === 'produtor') {
        return destinoStatusProdutor(usuario.status)
      }
    } catch (error) {
      console.error('Não foi possível validar a sessão atual:', error)
    }
  }

  if (to.meta.requiresProducer) {
    try {
      const produtor = await authService.produtorAtual()

      if (!produtor) {
        return { name: 'login', query: { redirect: to.fullPath } }
      }

      const statusPermitidos = to.meta.allowedProducerStatuses as string[] | undefined

      if (statusPermitidos && !statusPermitidos.includes(produtor.status)) {
        return destinoStatusProdutor(produtor.status)
      }

      if (to.meta.requiresApprovedProducer && produtor.status !== 'APROVADO') {
        return destinoStatusProdutor(produtor.status)
      }
    } catch (error) {
      console.error('Não foi possível validar a sessão do produtor:', error)
      return { name: 'login' }
    }
  }
})

export default router
