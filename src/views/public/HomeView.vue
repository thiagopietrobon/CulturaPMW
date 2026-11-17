<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
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
  categoriaId: null,
  regiaoId: null,
  gratuito: 'todos',
  periodo: 'todos'
})

async function carregarEventos() {
  carregando.value = true
  erro.value = null
  try {
    eventos.value = await eventoService.listarPublicos(filtros.value)
  } catch (e) {
    erro.value = 'Não foi possível carregar a agenda de eventos no momento.'
    console.error(e)
  } finally {
    carregando.value = false
  }
}

let timerBusca: ReturnType<typeof setTimeout> | null = null

watch(
  filtros,
  () => {
    if (timerBusca) clearTimeout(timerBusca)
    timerBusca = setTimeout(() => {
      carregarEventos()
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
    console.error('Erro ao carregar filtros:', e)
  }
  await carregarEventos()
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

    <div v-if="carregando" class="estado-feedback">
      Carregando eventos...
    </div>

    <div v-else-if="erro" class="estado-feedback erro">
      {{ erro }}
    </div>

    <div v-else-if="eventos.length === 0" class="estado-feedback">
      Nenhum evento encontrado para os critérios selecionados.
    </div>

    <section v-else class="eventos-grid">
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

.estado-feedback.erro {
  color: #b91c1c;
  border-color: #fecaca;
}
</style>