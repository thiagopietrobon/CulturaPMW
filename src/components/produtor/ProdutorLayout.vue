<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { authService } from '../../services/AuthService'
import logoCulturaPMW from '../../assets/svg/culturapmw-logo.png'
import BotaoTema from '../layout/BotaoTema.vue'
import '../../assets/styles/produtor.css'
import '../../assets/styles/produtor-area.css'
import '../../assets/styles/produtor-painel.css'
import '../../assets/styles/produtor-eventos.css'

withDefaults(
  defineProps<{
    tituloTopbar?: string
  }>(),
  {
    tituloTopbar: 'Área do produtor'
  }
)

const STORAGE_KEY = 'culturapmw:produtor-sidebar-recolhida'

const router = useRouter()
const auth = useAuth() as ReturnType<typeof useAuth> & {
  sair?: () => Promise<void>
  logout?: () => Promise<void>
}
const service = authService as typeof authService & {
  sair?: () => Promise<void>
  logout?: () => Promise<void>
}

const barraRecolhida = ref(false)
const menuMobileAberto = ref(false)
const modalSairAberto = ref(false)
const encerrandoSessao = ref(false)
const erroSair = ref('')

function lerEstadoBarra(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function salvarEstadoBarra(recolhida: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, recolhida ? '1' : '0')
  } catch {
    // Ignora falhas de armazenamento em navegação privada
  }
}

function alternarBarraLateral() {
  if (window.innerWidth <= 860) {
    menuMobileAberto.value = !menuMobileAberto.value
    return
  }
  barraRecolhida.value = !barraRecolhida.value
  salvarEstadoBarra(barraRecolhida.value)
}

function abrirConfirmacaoSair() {
  erroSair.value = ''
  menuMobileAberto.value = false
  modalSairAberto.value = true
}

function fecharConfirmacaoSair() {
  if (encerrandoSessao.value) return
  modalSairAberto.value = false
  erroSair.value = ''
}

async function confirmarEncerramentoSessao() {
  encerrandoSessao.value = true
  erroSair.value = ''
  try {
    if (typeof auth.sair === 'function') {
      await auth.sair()
    } else if (typeof service.sair === 'function') {
      await service.sair()
    } else if (typeof auth.logout === 'function') {
      await auth.logout()
    } else if (typeof service.logout === 'function') {
      await service.logout()
    }

    modalSairAberto.value = false
    await router.push('/')
  } catch (error) {
    console.error('[CulturaPMW] Falha ao encerrar sessão do produtor:', error)
    erroSair.value = 'Não foi possível encerrar a sessão agora. Tente novamente.'
  } finally {
    encerrandoSessao.value = false
  }
}

function aoPressionarTecla(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  if (modalSairAberto.value) {
    fecharConfirmacaoSair()
  } else if (menuMobileAberto.value) {
    menuMobileAberto.value = false
  }
}

onMounted(() => {
  barraRecolhida.value = lerEstadoBarra()
  window.addEventListener('keydown', aoPressionarTecla)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', aoPressionarTecla)
})
</script>

<template>
  <div
    class="produtor-area-page produtor-layout"
    :class="{ 'is-sidebar-collapsed': barraRecolhida }"
  >
    <!-- Backdrop mobile -->
    <div
      v-if="menuMobileAberto"
      class="produtor-sidebar-backdrop"
      aria-hidden="true"
      @click="menuMobileAberto = false"
    ></div>

    <!-- Barra lateral -->
    <aside
      class="produtor-sidebar"
      :class="{
        'is-open': menuMobileAberto,
        'is-collapsed': barraRecolhida
      }"
      aria-label="Navegação da área do produtor"
    >
      <RouterLink
        to="/"
        class="produtor-sidebar-brand"
        :title="barraRecolhida ? 'CulturaPMW — Tela principal' : undefined"
        aria-label="CulturaPMW — voltar para a agenda principal"
        @click="menuMobileAberto = false"
      >
        <div v-if="!barraRecolhida" class="produtor-sidebar-logo-box">
          <img
            :src="logoCulturaPMW"
            alt="CulturaPMW"
            width="560"
            height="163"
            class="produtor-sidebar-logo-img"
          />
        </div>
        <div v-else class="produtor-sidebar-logo-mini" aria-hidden="true">C</div>

        <span v-if="!barraRecolhida" class="produtor-sidebar-role">Área do produtor</span>
      </RouterLink>

      <p v-if="!barraRecolhida" class="produtor-sidebar-section">GERENCIAMENTO</p>

      <nav class="produtor-sidebar-nav">
        <RouterLink
          to="/produtor/painel"
          class="produtor-sidebar-link"
          active-class="is-active"
          :title="barraRecolhida ? 'Visão geral' : undefined"
          @click="menuMobileAberto = false"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="4" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="4" width="7" height="7" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
          </svg>
          <span>Visão geral</span>
        </RouterLink>

        <RouterLink
          to="/produtor/perfil"
          class="produtor-sidebar-link"
          active-class="is-active"
          :title="barraRecolhida ? 'Meu perfil' : undefined"
          @click="menuMobileAberto = false"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="8" r="3.8" />
            <path d="M5 19.5c1.5-3.4 4.2-5 7-5s5.5 1.6 7 5" />
          </svg>
          <span>Meu perfil</span>
        </RouterLink>

        <RouterLink
          to="/produtor/eventos"
          class="produtor-sidebar-link"
          active-class="is-active"
          :title="barraRecolhida ? 'Meus eventos' : undefined"
          @click="menuMobileAberto = false"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
            <path d="M8 3v4M16 3v4M3.5 9.5h17" />
          </svg>
          <span>Meus eventos</span>
        </RouterLink>
      </nav>

      <div class="produtor-sidebar-footer">
        <RouterLink
          to="/"
          class="produtor-sidebar-back"
          :title="barraRecolhida ? 'Voltar ao site' : undefined"
          @click="menuMobileAberto = false"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m11 18-6-6 6-6" />
          </svg>
          <span>Voltar ao site</span>
        </RouterLink>

        <button
          type="button"
          class="produtor-sidebar-logout"
          :title="barraRecolhida ? 'Encerrar sessão' : undefined"
          @click="abrirConfirmacaoSair"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          <span>Encerrar sessão</span>
        </button>
      </div>
    </aside>

    <!-- Área principal -->
    <div class="produtor-workspace">
      <header class="produtor-topbar">
        <div class="produtor-topbar-left">
          <button
            type="button"
            class="produtor-sidebar-toggle"
            :aria-expanded="!barraRecolhida"
            :aria-label="barraRecolhida ? 'Expandir barra lateral' : 'Recolher barra lateral'"
            :title="barraRecolhida ? 'Expandir menu' : 'Recolher menu'"
            @click="alternarBarraLateral"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2.5" />
              <path d="M9 4v16" />
              <path v-if="barraRecolhida" d="m13 10 2.5 2-2.5 2" />
              <path v-else d="m15.5 10-2.5 2 2.5 2" />
            </svg>
          </button>

          <span>{{ tituloTopbar }}</span>
        </div>

        <div class="produtor-topbar-right">
          <BotaoTema />
          <span class="produtor-status-badge is-approved">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="m8.5 12.2 2.3 2.3 4.8-4.8" />
            </svg>
            <span>Cadastro aprovado</span>
          </span>
        </div>
      </header>

      <main class="produtor-content">
        <slot />
      </main>
    </div>

    <!-- Modal de confirmação para encerrar sessão -->
    <Teleport to="body">
      <div
        v-if="modalSairAberto"
        class="produtor-modal-backdrop"
        role="presentation"
        @click.self="fecharConfirmacaoSair"
      >
        <div
          class="produtor-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-sair-titulo"
          aria-describedby="modal-sair-descricao"
        >
          <div class="produtor-modal-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </div>

          <h2 id="modal-sair-titulo">Encerrar sessão?</h2>
          <p id="modal-sair-descricao">
            Você precisará informar seu e-mail e senha novamente para acessar a área do produtor.
          </p>

          <p v-if="erroSair" class="produtor-modal-error" role="alert">
            {{ erroSair }}
          </p>

          <div class="produtor-modal-actions">
            <button
              type="button"
              class="produtor-btn-secondary produtor-modal-btn"
              :disabled="encerrandoSessao"
              @click="fecharConfirmacaoSair"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="produtor-btn-danger produtor-modal-btn"
              :disabled="encerrandoSessao"
              @click="confirmarEncerramentoSessao"
            >
              {{ encerrandoSessao ? 'Encerrando...' : 'Sim, encerrar sessão' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>