<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useProdutorEventos } from '../../composables/useProdutorEventos'
import ProdutorLayout from '../../components/produtor/ProdutorLayout.vue'
import '../../assets/styles/produtor-eventos.css'

const { perfil } = useAuth()
const {
  carregando,
  erro,
  resumo,
  eventosOrdenados,
  carregarEventos,
  formatarData,
  formatarLocalizacao,
  situacaoTexto,
  situacaoClasse
} = useProdutorEventos()

const iniciais = computed(() => {
  const nome = perfil.value?.nome?.trim()
  if (!nome) return 'PR'
  const partes = nome.split(/\s+/).filter(Boolean)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
})

function atualizarResumo() {
  return carregarEventos('Não foi possível carregar o resumo dos seus eventos.')
}

onMounted(atualizarResumo)
</script>

<template>
  <ProdutorLayout titulo-topbar="Visão geral">
    <header class="produtor-content-header">
      <div class="produtor-welcome-row">
        <div class="produtor-avatar" aria-hidden="true">{{ iniciais }}</div>
        <div>
          <p class="produtor-breadcrumb">CULTURAPMW / VISÃO GERAL</p>
          <h1>Olá, {{ perfil?.nome ?? 'produtor' }}!</h1>
          <p class="produtor-content-subtitle">
            Acompanhe o resumo da sua conta e das atrações cadastradas em Palmas-TO.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="produtor-btn-secondary produtor-refresh-btn"
        :disabled="carregando"
        @click="atualizarResumo"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 11a8 8 0 1 0 2 5.3" />
          <path d="M20 4v7h-7" />
        </svg>
        <span>Atualizar</span>
      </button>
    </header>

    <section class="produtor-kpis" aria-label="Resumo numérico">
      <article class="produtor-kpi-card">
        <span>Eventos cadastrados</span>
        <strong>{{ carregando ? '—' : resumo.total }}</strong>
      </article>

      <article class="produtor-kpi-card is-highlight">
        <span>Publicados na agenda</span>
        <strong>{{ carregando ? '—' : resumo.ativos }}</strong>
      </article>

      <article class="produtor-kpi-card">
        <span>Concluídos</span>
        <strong>{{ carregando ? '—' : resumo.concluidos }}</strong>
      </article>
    </section>

    <section class="produtor-summary-card" aria-labelledby="resumo-eventos-titulo">
      <div class="produtor-summary-head">
        <div>
          <h2 id="resumo-eventos-titulo">Resumo dos eventos</h2>
          <p>Para publicar ou alterar informações, utilize <strong>Meus eventos</strong> no menu lateral.</p>
        </div>
      </div>

      <div v-if="carregando" class="produtor-summary-state" role="status">
        Carregando resumo dos eventos...
      </div>

      <div v-else-if="erro" class="produtor-summary-state is-error" role="alert">
        {{ erro }}
      </div>

      <div v-else-if="eventosOrdenados.length === 0" class="produtor-summary-state">
        Nenhum evento publicado até o momento.
      </div>

      <ul v-else class="produtor-eventos-lista">
        <li
          v-for="evento in eventosOrdenados"
          :key="evento.id"
          class="produtor-evento-card"
        >
          <img
            v-if="evento.imagem_url"
            :src="evento.imagem_url"
            :alt="evento.titulo"
            class="produtor-evento-thumb"
          />
          <div
            v-else
            class="produtor-evento-thumb is-placeholder"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24">
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
              <path d="M8 3v4M16 3v4M3.5 9.5h17" />
            </svg>
            <span>Sem capa</span>
          </div>

          <div class="produtor-evento-body">
            <div class="produtor-evento-top">
              <span class="produtor-evento-categoria">
                {{ evento.categoria?.nome ?? 'Categoria não informada' }}
              </span>
              <span class="produtor-pill" :class="situacaoClasse(evento)">
                {{ situacaoTexto(evento) }}
              </span>
            </div>

            <h3 class="produtor-evento-titulo">{{ evento.titulo }}</h3>

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
          </div>
        </li>
      </ul>
    </section>
  </ProdutorLayout>
</template>