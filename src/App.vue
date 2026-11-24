<script setup lang="ts">
import { computed, onUnmounted, ref, type Component } from 'vue'
import {
  useRoute,
  useRouter,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded
} from 'vue-router'
import logoCulturaPMW from './assets/svg/culturapmw-logo.png'
import BotaoTema from './components/layout/BotaoTema.vue'

const routeAtual = useRoute()
const router = useRouter()

const TELAS_PRODUTOR_TRANSICAO = new Set([
  'PainelProdutorView',
  'AguardandoAprovacaoView',
  'ProdutorAguardandoAprovacaoView'
])

const ROTAS_PRODUTOR_TRANSICAO = new Set([
  '/produtor/painel',
  '/produtor/aguardando-aprovacao'
])

const DURACAO_MINIMA_LOADER_MS = 680

const exibindoLoaderProdutor = ref(false)
let inicioLoader = 0
let timerFechamento: number | undefined
let timerSeguranca: number | undefined

const possuiFundoAuth = computed(
  () => routeAtual.meta.transition === 'auth'
)

// Telas com cabeçalho próprio já mostram o botão de tema;
// nas demais (login, cadastro, status, formulários) ele fica flutuante.
const ROTAS_COM_BOTAO_TEMA = new Set(['produtor-painel', 'produtor-eventos'])
const mostrarBotaoTemaFlutuante = computed(() => {
  if (routeAtual.matched.length === 0) return false
  const caminho = routeAtual.path
  if (caminho === '/' || caminho.startsWith('/eventos/') || caminho.startsWith('/produtores/')) return false
  if (caminho.startsWith('/admin')) return false
  return !ROTAS_COM_BOTAO_TEMA.has(String(routeAtual.name ?? ''))
})

function extrairNomeComponente(componente: Component | undefined): string {
  const tipo = (componente as { type?: { name?: string; __name?: string } } | undefined)?.type
  return tipo?.name || tipo?.__name || ''
}

function ehRotaProdutor(
  route: RouteLocationNormalized | RouteLocationNormalizedLoaded,
  componente?: Component
): boolean {
  if (route.meta.transition === 'produtor') return true

  const nomeRota = typeof route.name === 'string' ? route.name : ''
  const nomeComponente = extrairNomeComponente(componente)

  return (
    ROTAS_PRODUTOR_TRANSICAO.has(route.path) ||
    TELAS_PRODUTOR_TRANSICAO.has(nomeRota) ||
    TELAS_PRODUTOR_TRANSICAO.has(nomeComponente)
  )
}

function limparTimers(): void {
  if (timerFechamento !== undefined) {
    window.clearTimeout(timerFechamento)
    timerFechamento = undefined
  }
  if (timerSeguranca !== undefined) {
    window.clearTimeout(timerSeguranca)
    timerSeguranca = undefined
  }
}

function iniciarLoaderProdutor(): void {
  limparTimers()
  if (!exibindoLoaderProdutor.value) {
    exibindoLoaderProdutor.value = true
    inicioLoader = performance.now()
  }
  timerSeguranca = window.setTimeout(() => {
    exibindoLoaderProdutor.value = false
  }, 3000)
}

function encerrarLoaderProdutor(imediato = false): void {
  limparTimers()
  if (!exibindoLoaderProdutor.value) return

  if (imediato) {
    exibindoLoaderProdutor.value = false
    return
  }

  const decorrido = performance.now() - inicioLoader
  const restante = Math.max(0, DURACAO_MINIMA_LOADER_MS - decorrido)

  timerFechamento = window.setTimeout(() => {
    exibindoLoaderProdutor.value = false
  }, restante)
}

const removerBeforeEach = router.beforeEach((to, from) => {
  const mudouDeTela = from.matched.length === 0 || to.path !== from.path
  if (mudouDeTela && ehRotaProdutor(to)) {
    iniciarLoaderProdutor()
  }
})

const removerAfterEach = router.afterEach((to, _from, failure) => {
  if (failure || !ehRotaProdutor(to)) {
    encerrarLoaderProdutor(true)
    return
  }
  encerrarLoaderProdutor(false)
})

const removerOnError = router.onError(() => {
  encerrarLoaderProdutor(true)
  estadoBarra.value = 'parada'
})

// Barra fina no topo enquanto a próxima página carrega
const estadoBarra = ref<'parada' | 'ativa' | 'concluida'>('parada')
let timerBarra: number | undefined

const removerBarraInicio = router.beforeEach((to, from) => {
  if (to.path === from.path) return
  window.clearTimeout(timerBarra)
  estadoBarra.value = 'ativa'
})

const removerBarraFim = router.afterEach(() => {
  if (estadoBarra.value !== 'ativa') return
  estadoBarra.value = 'concluida'
  timerBarra = window.setTimeout(() => {
    estadoBarra.value = 'parada'
  }, 600)
})

onUnmounted(() => {
  limparTimers()
  removerBeforeEach()
  removerAfterEach()
  removerOnError()
  removerBarraInicio()
  removerBarraFim()
  window.clearTimeout(timerBarra)
})

function nomeTransicao(
  componente: Component | undefined,
  route: RouteLocationNormalizedLoaded
): string {
  if (route.meta.transition === 'auth') return 'auth-dissolve'
  if (ehRotaProdutor(route, componente)) return 'produtor-enter'
  return 'pagina-cruzada'
}

function chaveRota(
  componente: Component | undefined,
  route: RouteLocationNormalizedLoaded
): string {
  if (route.meta.transition === 'auth' || ehRotaProdutor(route, componente)) {
    return route.fullPath
  }
  return route.matched[0]?.path || route.path
}
</script>

<template>
  <div
    class="app-shell"
    :class="{ 'app-shell--auth': possuiFundoAuth }"
  >
    <div
      class="barra-navegacao"
      :class="{
        'is-ativa': estadoBarra === 'ativa',
        'is-concluida': estadoBarra === 'concluida'
      }"
      aria-hidden="true"
    ></div>

    <!-- Fundo persistente: não participa da transição -->
    <div
      v-if="possuiFundoAuth"
      class="auth-shared-background"
      aria-hidden="true"
    ></div>

    <!-- Mini animação de entrada exclusiva da área de produtores -->
    <Transition name="produtor-curtain">
      <div
        v-if="exibindoLoaderProdutor"
        class="produtor-loader-overlay"
        role="status"
        aria-live="polite"
      >
        <div class="produtor-loader-box">
          <img
            :src="logoCulturaPMW"
            alt="CulturaPMW"
            class="produtor-loader-logo"
          />

          <div class="produtor-loader-bars" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>

          <p class="produtor-loader-title">Carregando área de produtores...</p>
          <span class="produtor-loader-subtitle">Preparando seu ambiente</span>

          <div class="produtor-loader-track" aria-hidden="true">
            <div class="produtor-loader-bar"></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Somente o conteúdo das telas é animado -->
    <div class="app-route-layer">
      <RouterView v-slot="{ Component, route }">
        <Transition
          :name="nomeTransicao(Component, route)"
          :appear="ehRotaProdutor(route, Component)"
        >
          <component
            :is="Component"
            :key="chaveRota(Component, route)"
          />
        </Transition>
      </RouterView>
    </div>

    <BotaoTema v-if="mostrarBotaoTemaFlutuante" flutuante />
  </div>
</template>

<style src="./assets/styles/transicao-basica.css"></style>
<style src="./assets/styles/transicao-produtor.css"></style>