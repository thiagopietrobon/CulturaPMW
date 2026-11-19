<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import EventoCard from '../../components/eventos/EventoCard.vue'
import EventosFiltros from '../../components/eventos/EventosFiltros.vue'
import type { Categoria } from '../../models/Categoria'
import type { Evento } from '../../models/Evento'
import type { Regiao } from '../../models/Regiao'
import { eventoService, type FiltrosEventos } from '../../services/EventoService'

const eventos = ref<Evento[]>([])
const categorias = ref<Categoria[]>([])
const regioes = ref<Regiao[]>([])

const carregando = ref(true)
const erro = ref<string | null>(null)
const filtros = ref<FiltrosEventos>({
  busca: '',
  categoriaIds: [],
  regiaoIds: [],
  gratuito: 'todos',
  periodo: 'todos'
})

let timerBusca: ReturnType<typeof setTimeout> | null = null
let sequenciaConsulta = 0

const mensagemVazia = computed(() => {
  if (filtros.value.periodo === 'hoje') {
    return 'Não há eventos programados para hoje com os filtros selecionados.'
  }
  if (filtros.value.periodo === 'fim-de-semana') {
    return 'Não há eventos disponíveis para este final de semana com os filtros selecionados.'
  }
  return 'Nenhum evento encontrado para os critérios selecionados.'
})

const possuiFiltros = computed(() => Boolean(
  filtros.value.busca?.trim()
  || filtros.value.categoriaIds?.length
  || filtros.value.regiaoIds?.length
  || filtros.value.gratuito !== 'todos'
  || filtros.value.periodo !== 'todos'
))

async function carregarEventos() {
  const sequenciaAtual = ++sequenciaConsulta
  carregando.value = true
  erro.value = null

  try {
    const resultado = await eventoService.listarPublicos(filtros.value)
    if (sequenciaAtual !== sequenciaConsulta) return
    eventos.value = resultado
  } catch (e) {
    if (sequenciaAtual !== sequenciaConsulta) return
    erro.value = 'Não foi possível carregar a agenda de eventos no momento.'
    console.error('[CulturaPMW] Erro ao carregar agenda pública:', e)
  } finally {
    if (sequenciaAtual === sequenciaConsulta) carregando.value = false
  }
}

function limparFiltros() {
  filtros.value = {
    busca: '',
    categoriaIds: [],
    regiaoIds: [],
    gratuito: 'todos',
    periodo: 'todos'
  }
}

watch(
  filtros,
  () => {
    // Invalida respostas antigas imediatamente, evitando que uma busca anterior
    // sobrescreva o resultado dos filtros mais recentes.
    sequenciaConsulta += 1
    carregando.value = true
    if (timerBusca) clearTimeout(timerBusca)
    timerBusca = setTimeout(() => {
      void carregarEventos()
    }, 250)
  },
  { deep: true }
)

onMounted(async () => {
  try {
    const [cats, regs] = await Promise.all([
      eventoService.listarCategorias(),
      eventoService.listarRegioes()
    ])
    categorias.value = cats
    regioes.value = regs
  } catch (e) {
    console.error('[CulturaPMW] Erro ao carregar opções dos filtros:', e)
  }
  await carregarEventos()
})

onBeforeUnmount(() => {
  if (timerBusca) clearTimeout(timerBusca)
  sequenciaConsulta += 1
})
</script>

<template>
  <div class="home-container">
    <header class="hero">
      <h1>Agenda Cultural de Palmas-TO</h1>
      <p>Descubra eventos culturais, esportivos e de lazer acontecendo na cidade.</p>
    </header>

    <EventosFiltros
      v-model="filtros"
      :categorias="categorias"
      :regioes="regioes"
    />

    <div v-if="carregando" class="estado-feedback" role="status" aria-live="polite">
      Carregando eventos...
    </div>

    <div v-else-if="erro" class="estado-feedback erro" role="alert">
      <p>{{ erro }}</p>
      <button type="button" class="acao-feedback" @click="carregarEventos">Tentar novamente</button>
    </div>

    <div v-else-if="eventos.length === 0" class="estado-feedback">
      <p>{{ mensagemVazia }}</p>
      <button v-if="possuiFiltros" type="button" class="acao-feedback" @click="limparFiltros">
        Limpar filtros
      </button>
    </div>

    <section v-else class="eventos-grid" aria-label="Eventos disponíveis em Palmas">
      <EventoCard
        v-for="evento in eventos"
        :key="evento.id"
        :evento="evento"
      />
    </section>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.hero {
  background-color: #08428c;
  color: #ffffff;
  padding: 28px 24px;
  border-radius: 12px;
}

.hero h1 {
  margin: 0 0 8px 0;
  font-size: 1.75rem;
}

.hero p {
  margin: 0;
  opacity: 0.9;
}

.eventos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.estado-feedback {
  text-align: center;
  padding: 48px 16px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #475569;
  font-weight: 500;
}

.estado-feedback p {
  margin: 0 0 12px;
}

.estado-feedback.erro {
  color: #b91c1c;
  border-color: #fecaca;
}

.acao-feedback {
  padding: 9px 14px;
  border: 0;
  border-radius: 7px;
  background: #1154d9;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}
</style>
