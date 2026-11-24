<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService, type PerfilAutenticado } from '../../services/AuthService'
import BotaoTema from '../../components/layout/BotaoTema.vue'
import '../../assets/styles/admin.css'

const router = useRouter()
const route = useRoute()
const administrador = ref<PerfilAutenticado | null>(null)
const saindo = ref(false)

// Menu lateral no celular (mesmo comportamento da área do produtor)
const menuMobileAberto = ref(false)

function alternarMenuMobile() {
  menuMobileAberto.value = !menuMobileAberto.value
}

function fecharMenuMobile() {
  menuMobileAberto.value = false
}

function aoPressionarTecla(event: KeyboardEvent) {
  if (event.key === 'Escape') fecharMenuMobile()
}

// Fecha o menu ao trocar de página
watch(() => route.fullPath, fecharMenuMobile)

onMounted(async () => {
  window.addEventListener('keydown', aoPressionarTecla)
  administrador.value = await authService.administradorAtual()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', aoPressionarTecla)
})

async function sair() {
  saindo.value = true
  try {
    await authService.sair()
    await router.replace({ name: 'login' })
  } catch (error) {
    console.error(error)
    window.alert('Não foi possível encerrar a sessão.')
  } finally {
    saindo.value = false
  }
}
</script>

<template>
  <div class="admin-shell">
    <!-- Fundo escurecido atrás do menu no celular -->
    <div
      v-if="menuMobileAberto"
      class="admin-sidebar-backdrop"
      aria-hidden="true"
      @click="fecharMenuMobile"
    ></div>

    <aside
      id="admin-menu-lateral"
      class="admin-sidebar"
      :class="{ 'is-open': menuMobileAberto }"
      aria-label="Navegação do painel administrativo"
    >
      <RouterLink to="/admin" class="admin-brand">
        <span class="admin-brand-mark">C</span>
        <span>
          <strong>CulturaPMW</strong>
          <small>Painel administrativo</small>
        </span>
      </RouterLink>

      <div class="admin-nav-label">GERENCIAMENTO</div>
      <nav class="admin-nav">
        <RouterLink :to="{ name: 'admin-dashboard' }" class="admin-nav-link" exact-active-class="ativo">
          <span class="admin-nav-icon">▦</span> Visão geral
        </RouterLink>
        <RouterLink :to="{ name: 'admin-produtores' }" class="admin-nav-link" active-class="ativo">
          <span class="admin-nav-icon">♙</span> Produtores
        </RouterLink>
        <RouterLink :to="{ name: 'admin-eventos' }" class="admin-nav-link" active-class="ativo">
          <span class="admin-nav-icon">▣</span> Eventos
        </RouterLink>
        <RouterLink :to="{ name: 'admin-categorias' }" class="admin-nav-link" active-class="ativo">
          <span class="admin-nav-icon">▤</span> Categorias
        </RouterLink>
      </nav>

      <div class="admin-sidebar-bottom">
        <RouterLink to="/" class="admin-back-public">← Voltar ao site</RouterLink>
        <div class="admin-user">
          <div class="admin-avatar">{{ administrador?.nome?.charAt(0)?.toUpperCase() ?? 'A' }}</div>
          <div class="admin-user-info">
            <strong>{{ administrador?.nome ?? 'Administrador' }}</strong>
            <small>{{ administrador?.email ?? 'Sessão administrativa' }}</small>
          </div>
        </div>
        <button class="admin-logout" type="button" :disabled="saindo" @click="sair">
          {{ saindo ? 'Saindo...' : 'Encerrar sessão' }}
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-topbar">
        <div class="admin-topbar-left">
          <button
            type="button"
            class="admin-menu-toggle"
            aria-controls="admin-menu-lateral"
            :aria-expanded="menuMobileAberto"
            :aria-label="menuMobileAberto ? 'Fechar menu' : 'Abrir menu'"
            @click="alternarMenuMobile"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2.5" />
              <path d="M9 4v16" />
            </svg>
          </button>
          <span>Área administrativa</span>
        </div>
        <div class="admin-topbar-right">
          <BotaoTema />
          <span class="admin-topbar-status"><i></i> Painel protegido</span>
        </div>
      </header>
      <div class="admin-content">
        <RouterView v-slot="{ Component, route }">
          <Transition name="pagina" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </div>
    </main>
  </div>
</template>
