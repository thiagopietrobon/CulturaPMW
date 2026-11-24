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

    <div id="eventos" class="ancora-eventos" aria-hidden="true"></div>

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
/* Âncora do link "Eventos": invisível e sem ocupar espaço
   (o margin negativo anula o gap de 28px do .home-container). */
.ancora-eventos {
  margin-bottom: -28px;
  scroll-margin-top: 100px;
}

.home-container {
  display: flex;
  max-width: 1200px;
  flex-direction: column;
  gap: 28px;
  margin: 0 auto;
  padding: 28px 20px 56px;
}

/* =========================================================
   HERO
   ========================================================= */
.hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: clamp(40px, 7vw, 76px) clamp(24px, 5vw, 56px) clamp(84px, 9vw, 112px);
  border-radius: 28px;
  background:
    radial-gradient(600px 300px at 90% 10%, rgb(111 179 255 / 45%), transparent 70%),
    linear-gradient(120deg, #08428c 0%, #1154d9 45%, #117cd9 75%, #08428c 100%);
  background-size: 100% 100%, 220% 220%;
  box-shadow: 0 22px 54px rgb(8 46 99 / 24%);
  color: #fff;
  animation:
    cp-scale-in 0.8s var(--ease-out) backwards,
    cp-gradient-pan 16s ease infinite;
}

/* Silhueta de Palmas ao fundo */
.hero::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: auto 0 0;
  height: 75%;
  background: url('../../assets/svg/login-Palmas.svg') center bottom / cover no-repeat;
  opacity: 0.16;
  mix-blend-mode: luminosity;
  mask-image: linear-gradient(180deg, transparent 0%, #000 55%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 55%);
}

/* Bolha luminosa flutuando */
.hero::after {
  content: '';
  position: absolute;
  z-index: -1;
  top: -120px;
  right: -60px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(255 255 255 / 22%), transparent 65%);
  animation: cp-drift 12s ease-in-out infinite;
}

.hero h1 {
  max-width: 760px;
  margin: 0 0 14px;
  font-size: clamp(30px, 5vw, 52px);
  font-weight: 850;
  letter-spacing: -0.035em;
  line-height: 1.05;
  text-shadow: 0 4px 24px rgb(4 19 40 / 25%);
  animation: cp-fade-up 0.8s var(--ease-out) 0.15s backwards;
}

/* Selo acima do título */
.hero h1::before {
  content: 'Palmas · Tocantins';
  display: block;
  width: fit-content;
  margin-bottom: 16px;
  padding: 6px 14px;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 999px;
  background: rgb(255 255 255 / 14%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #e2eeff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.4;
  text-shadow: none;
  text-transform: uppercase;
}

.hero p {
  max-width: 560px;
  margin: 0;
  color: #dceaff;
  font-size: clamp(15px, 1.6vw, 18px);
  font-weight: 500;
  line-height: 1.55;
  animation: cp-fade-up 0.8s var(--ease-out) 0.28s backwards;
}

/* Os filtros sobem por cima da borda inferior do hero.
   Seletor direto na caixa de filtros (antes era ".hero + *", que passou a
   pegar a âncora invisível #eventos e tirou a camada dos filtros). */
.hero ~ .filtros-box {
  position: relative;
  z-index: 2;
  margin: -84px clamp(10px, 3vw, 32px) 0;
  animation: cp-fade-up 0.7s var(--ease-out) 0.35s backwards;
}

/* =========================================================
   GRADE DE EVENTOS (entrada em cascata)
   ========================================================= */
.eventos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.eventos-grid > * {
  animation: cp-fade-up 0.55s var(--ease-out) backwards;
}

.eventos-grid > :nth-child(1) { animation-delay: 0.05s; }
.eventos-grid > :nth-child(2) { animation-delay: 0.10s; }
.eventos-grid > :nth-child(3) { animation-delay: 0.15s; }
.eventos-grid > :nth-child(4) { animation-delay: 0.20s; }
.eventos-grid > :nth-child(5) { animation-delay: 0.25s; }
.eventos-grid > :nth-child(6) { animation-delay: 0.30s; }
.eventos-grid > :nth-child(7) { animation-delay: 0.35s; }
.eventos-grid > :nth-child(8) { animation-delay: 0.40s; }
.eventos-grid > :nth-child(n + 9) { animation-delay: 0.45s; }

/* =========================================================
   ESTADOS: CARREGANDO / VAZIO / ERRO
   ========================================================= */
.estado-feedback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 56px 20px;
  border: 1px solid rgb(255 255 255 / 92%);
  border-radius: 22px;
  background: rgb(255 255 255 / 92%);
  box-shadow: var(--shadow-md);
  color: #5b7192;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  animation: cp-fade-up 0.5s var(--ease-out) backwards;
}

.estado-feedback::before {
  content: '';
  display: block;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231154d9' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cpath d='m20 20-4.2-4.2'/%3E%3C/svg%3E") center / 26px no-repeat,
    #eef6ff;
  animation: cp-float 3.2s ease-in-out infinite;
}

/* Carregando: anel girando */
.estado-feedback[role='status']::before {
  width: 44px;
  height: 44px;
  border: 4px solid rgb(17 84 217 / 15%);
  border-top-color: #1154d9;
  border-radius: 50%;
  background: none;
  animation: cp-spin 0.8s linear infinite;
}

.estado-feedback.erro {
  border-color: #f0b8b8;
  color: #a32626;
}

.estado-feedback.erro::before {
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a32626' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 7.5v5.5M12 16.5h.01'/%3E%3C/svg%3E") center / 26px no-repeat,
    #fff5f5;
  animation: cp-shake 0.5s ease backwards;
}

.estado-feedback p {
  max-width: 460px;
  margin: 0;
}

.acao-feedback {
  min-height: 44px;
  padding: 0 20px;
  border: 1px solid #08428c;
  border-radius: 12px;
  background: var(--gradient-brand);
  box-shadow: 0 8px 20px rgb(8 66 140 / 25%);
  color: #fff;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
  transition: transform var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}

.acao-feedback:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgb(8 66 140 / 32%);
}

@media (max-width: 640px) {
  .home-container {
    padding: 16px 14px 40px;
  }

  .hero {
    border-radius: 22px;
  }

  .hero ~ .filtros-box {
    margin-inline: 6px;
  }
}

/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */
html[data-theme='escuro'] .hero {
  background-image: radial-gradient(600px 300px at 90% 10%, rgb(111 179 255 / 45%), transparent 70%), linear-gradient(120deg, #08428c 0%, #1154d9 45%, #117cd9 75%, #08428c 100%);
  background-color: transparent;
  box-shadow: 0 22px 54px rgb(8 46 99 / 24%);
  color: #fff;
}

html[data-theme='escuro'] .hero::after {
  background-image: radial-gradient(circle, rgb(255 255 255 / 22%), transparent 65%);
  background-color: transparent;
}

html[data-theme='escuro'] .hero h1 {
  text-shadow: 0 4px 24px rgb(4 19 40 / 25%);
}

html[data-theme='escuro'] .hero h1::before {
  border: 1px solid rgb(255 255 255 / 28%);
  background-image: none;
  background-color: rgb(255 255 255 / 14%);
  color: #e2eeff;
  text-shadow: none;
}

html[data-theme='escuro'] .hero p {
  color: #dceaff;
}

html[data-theme='escuro'] .estado-feedback {
  border: 1px solid rgb(36 48 66 / 92%);
  background-image: none;
  background-color: rgb(19 27 40 / 92%);
  box-shadow: 0 8px 26px rgb(0 0 0 / 22%);
  color: #acb8cb;
}

html[data-theme='escuro'] .estado-feedback::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231154d9' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cpath d='m20 20-4.2-4.2'/%3E%3C/svg%3E"), none;
  background-color: #112133;
}

html[data-theme='escuro'] .estado-feedback[role='status']::before {
  border: 4px solid rgb(17 84 217 / 15%);
  border-top-color: #1154d9;
  background-image: none;
  background-color: transparent;
}

html[data-theme='escuro'] .estado-feedback.erro {
  border-color: #662727;
  color: #e89e9e;
}

html[data-theme='escuro'] .estado-feedback.erro::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a32626' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 7.5v5.5M12 16.5h.01'/%3E%3C/svg%3E"), none;
  background-color: #301010;
}

html[data-theme='escuro'] .acao-feedback {
  border: 1px solid #08428c;
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
  box-shadow: 0 8px 20px rgb(0 0 0 / 55%);
  color: #ffffff;
}

html[data-theme='escuro'] .acao-feedback:hover {
  box-shadow: 0 12px 26px rgb(0 0 0 / 55%);
}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>
