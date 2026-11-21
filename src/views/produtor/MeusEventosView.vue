<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  eventoService,
  type EventoGerenciadoProdutor
} from '../../services/EventoService'
import { useProdutorEventos } from '../../composables/useProdutorEventos'
import ProdutorLayout from '../../components/produtor/ProdutorLayout.vue'
import '../../assets/styles/produtor-eventos.css'

const route = useRoute()
const router = useRouter()
const {
  eventos,
  carregando,
  erro,
  resumo,
  obterProdutorId,
  carregarEventos,
  formatarData,
  formatarLocalizacao,
  situacaoTexto,
  situacaoClasse
} = useProdutorEventos()

const sucesso = ref('')
const chaveSucesso = ref(0)
const eventoParaExcluir = ref<EventoGerenciadoProdutor | null>(null)
const excluindo = ref(false)
const erroExclusao = ref('')
const botaoCancelarModal = ref<HTMLButtonElement | null>(null)
let timerSucesso: ReturnType<typeof setTimeout> | null = null

function limparTimerSucesso() {
  if (timerSucesso) {
    clearTimeout(timerSucesso)
    timerSucesso = null
  }
}

function mostrarSucesso(mensagem: string) {
  limparTimerSucesso()
  chaveSucesso.value += 1
  sucesso.value = mensagem
  timerSucesso = setTimeout(() => {
    sucesso.value = ''
    timerSucesso = null
  }, 5000)
}

function fecharSucesso() {
  limparTimerSucesso()
  sucesso.value = ''
}

async function abrirConfirmacaoExclusao(evento: EventoGerenciadoProdutor) {
  if (excluindo.value) return
  erroExclusao.value = ''
  eventoParaExcluir.value = evento
  document.body.style.overflow = 'hidden'
  await nextTick()
  botaoCancelarModal.value?.focus()
}

function fecharConfirmacaoExclusao() {
  if (excluindo.value) return
  eventoParaExcluir.value = null
  erroExclusao.value = ''
  document.body.style.overflow = ''
}

function aoPressionarTecla(event: KeyboardEvent) {
  if (event.key === 'Escape' && eventoParaExcluir.value && !excluindo.value) {
    fecharConfirmacaoExclusao()
  }
}

async function confirmarExclusao() {
  const alvo = eventoParaExcluir.value
  if (!alvo || excluindo.value) return

  excluindo.value = true
  erroExclusao.value = ''
  erro.value = ''
  fecharSucesso()

  try {
    const produtorId = await obterProdutorId()
    await eventoService.excluirMeuEvento(alvo.id, produtorId)

    eventoParaExcluir.value = null
    document.body.style.overflow = ''
    await carregarEventos()
    mostrarSucesso(`O evento "${alvo.titulo}" foi excluído com sucesso.`)
  } catch (error) {
    console.error('[CulturaPMW] Falha ao excluir evento:', error)
    erroExclusao.value =
      error instanceof Error ? error.message : 'Não foi possível excluir o evento. Tente novamente.'
  } finally {
    excluindo.value = false
  }
}

onMounted(async () => {
  window.addEventListener('keydown', aoPressionarTecla)

  const estadoSalvo = route.query.salvo
  if (estadoSalvo) {
    if (estadoSalvo === 'editado') {
      mostrarSucesso('Alterações do evento salvas com sucesso!')
    } else if (estadoSalvo === 'criado') {
      mostrarSucesso('Evento publicado com sucesso na agenda!')
    } else {
      mostrarSucesso('Evento salvo com sucesso!')
    }
    void router.replace({ name: 'produtor-eventos', query: {} })
  }

  await carregarEventos()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', aoPressionarTecla)
  limparTimerSucesso()
  document.body.style.overflow = ''
})
</script>

<template>
  <ProdutorLayout titulo-topbar="Meus eventos">
    <header class="produtor-content-header">
      <div>
        <p class="produtor-breadcrumb">CULTURAPMW / GERENCIAMENTO</p>
        <h1>Meus eventos</h1>
        <p class="produtor-content-subtitle">
          Publique novas atrações e mantenha atualizadas as informações dos eventos cadastrados.
        </p>
      </div>

      <RouterLink to="/produtor/eventos/novo" class="produtor-btn-primary produtor-primary-cta">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Publicar evento</span>
      </RouterLink>
    </header>

    <section class="produtor-kpis" aria-label="Resumo dos eventos">
      <article class="produtor-kpi-card">
        <span>Eventos cadastrados</span>
        <strong>{{ carregando ? '—' : resumo.total }}</strong>
      </article>
      <article class="produtor-kpi-card is-highlight">
        <span>Em andamento / publicados</span>
        <strong>{{ carregando ? '—' : resumo.ativos }}</strong>
      </article>
      <article class="produtor-kpi-card">
        <span>Concluídos</span>
        <strong>{{ carregando ? '—' : resumo.concluidos }}</strong>
      </article>
    </section>

    <Transition name="produtor-feedback">
      <div
        v-if="sucesso"
        :key="chaveSucesso"
        class="produtor-feedback-banner is-success"
        role="status"
        aria-live="polite"
      >
        <span class="produtor-success-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.5" pathLength="100" />
            <path d="M7.8 12.4 10.6 15.2 16.4 9.2" pathLength="100" />
          </svg>
        </span>

        <div class="produtor-feedback-content">
          <strong>Ação concluída</strong>
          <span>{{ sucesso }}</span>
        </div>

        <button
          type="button"
          class="produtor-alert-close"
          aria-label="Fechar aviso"
          @click="fecharSucesso"
        >
          ×
        </button>

        <span class="produtor-feedback-progress" aria-hidden="true"></span>
      </div>
    </Transition>

    <div v-if="erro" class="produtor-status-alert is-error produtor-eventos-alert" role="alert">
      <span>{{ erro }}</span>
      <button type="button" class="produtor-inline-action" @click="carregarEventos()">
        Tentar novamente
      </button>
    </div>

    <div v-if="carregando" class="produtor-eventos-vazio" role="status">
      Carregando seus eventos...
    </div>

    <section v-else-if="eventos.length === 0" class="produtor-eventos-vazio">
      <span class="produtor-eventos-vazio-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M8 3v4M16 3v4M3.5 9.5h17" />
          <path d="M12 13v4M10 15h4" />
        </svg>
      </span>
      <h2>Você ainda não publicou eventos</h2>
      <p>Comece cadastrando uma atração cultural, esportiva ou de lazer em Palmas.</p>
      <RouterLink to="/produtor/eventos/novo" class="produtor-btn-primary produtor-primary-cta">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Publicar meu primeiro evento</span>
      </RouterLink>
    </section>

    <TransitionGroup
      v-else
      name="produtor-evento-list"
      tag="section"
      class="produtor-eventos-lista"
      aria-label="Eventos cadastrados"
    >
      <article v-for="evento in eventos" :key="evento.id" class="produtor-evento-card">
        <img
          v-if="evento.imagem_url"
          :src="evento.imagem_url"
          :alt="evento.titulo"
          class="produtor-evento-thumb"
        />
        <div v-else class="produtor-evento-thumb is-placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
            <path d="M8 3v4M16 3v4M3.5 9.5h17" />
          </svg>
          <span>Sem capa</span>
        </div>

        <div class="produtor-evento-body">
          <div class="produtor-evento-top">
            <span class="produtor-evento-categoria">
              {{ evento.categoria?.nome ?? 'Categoria indisponível' }}
            </span>
            <span class="produtor-pill" :class="situacaoClasse(evento)">
              {{ situacaoTexto(evento) }}
            </span>
          </div>

          <h2 class="produtor-evento-titulo">{{ evento.titulo }}</h2>
          <p class="produtor-evento-descricao">{{ evento.descricao }}</p>

          <div class="produtor-evento-meta">
            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7.5v5l3.2 1.8" />
              </svg>
              {{ formatarData(evento.data_inicio) }} até {{ formatarData(evento.data_fim) }}
            </span>

            <span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10Z" />
                <circle cx="12" cy="11" r="2.2" />
              </svg>
              {{ formatarLocalizacao(evento) }}
            </span>

            <strong class="produtor-evento-preco">
              {{
                evento.gratuito
                  ? 'Gratuito'
                  : `R$ ${Number(evento.valor_ingresso ?? 0).toFixed(2).replace('.', ',')}`
              }}
            </strong>
          </div>

          <div class="produtor-evento-acoes">
            <RouterLink
              :to="`/produtor/eventos/${evento.id}/editar`"
              class="produtor-btn-secondary produtor-evento-btn"
            >
              Editar
            </RouterLink>

            <RouterLink
              v-if="evento.situacao !== 'OCULTO' && new Date(evento.data_fim) > new Date()"
              :to="`/eventos/${evento.id}`"
              class="produtor-btn-secondary produtor-evento-btn"
            >
              Visualizar página
            </RouterLink>

            <button
              type="button"
              class="produtor-btn-danger produtor-evento-btn"
              @click="abrirConfirmacaoExclusao(evento)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
              </svg>
              <span>Excluir</span>
            </button>
          </div>
        </div>
      </article>
    </TransitionGroup>

    <Teleport to="body">
      <div
        v-if="eventoParaExcluir"
        class="produtor-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-excluir-titulo"
        aria-describedby="modal-excluir-descricao"
        @click.self="fecharConfirmacaoExclusao"
      >
        <div class="produtor-modal-card">
          <div class="produtor-modal-header">
            <h2 id="modal-excluir-titulo">Excluir evento?</h2>
            <p id="modal-excluir-descricao">
              Esta ação é permanente e removerá o evento da agenda pública do CulturaPMW.
            </p>
          </div>

          <div class="produtor-modal-evento-preview">
            <img
              v-if="eventoParaExcluir.imagem_url"
              :src="eventoParaExcluir.imagem_url"
              :alt="eventoParaExcluir.titulo"
              class="produtor-modal-evento-thumb"
            />
            <div v-else class="produtor-modal-evento-thumb is-placeholder" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
                <path d="M8 3v4M16 3v4M3.5 9.5h17" />
              </svg>
              <span>Sem capa</span>
            </div>

            <div class="produtor-modal-evento-info">
              <span class="produtor-evento-categoria">
                {{ eventoParaExcluir.categoria?.nome ?? 'Categoria indisponível' }}
              </span>
              <strong>{{ eventoParaExcluir.titulo }}</strong>
              <small>{{ formatarData(eventoParaExcluir.data_inicio) }} • {{ formatarLocalizacao(eventoParaExcluir) }}</small>
            </div>
          </div>

          <p v-if="erroExclusao" class="produtor-modal-error" role="alert">
            {{ erroExclusao }}
          </p>

          <div class="produtor-modal-actions">
            <button
              ref="botaoCancelarModal"
              type="button"
              class="produtor-btn-secondary produtor-modal-btn"
              :disabled="excluindo"
              @click="fecharConfirmacaoExclusao"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="produtor-btn-danger produtor-modal-btn is-solid-danger"
              :disabled="excluindo"
              @click="confirmarExclusao"
            >
              {{ excluindo ? 'Excluindo...' : 'Sim, excluir evento' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </ProdutorLayout>
</template>