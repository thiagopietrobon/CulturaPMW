<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import EventoCard from '../../components/eventos/EventoCard.vue'
import type { Evento } from '../../models/Evento'
import type { Produtor } from '../../models/Produtor'
import { eventoService } from '../../services/EventoService'

const route = useRoute()
const produtor = ref<Produtor | null>(null)
const eventos = ref<Evento[]>([])
const carregando = ref(true)
const erro = ref<string | null>(null)
let sequenciaConsulta = 0

async function carregarPerfil() {
  const sequenciaAtual = ++sequenciaConsulta
  const id = String(route.params.id ?? '')
  produtor.value = null
  eventos.value = []
  erro.value = null
  carregando.value = true

  try {
    const prod = await eventoService.buscarProdutorPorId(id)
    if (sequenciaAtual !== sequenciaConsulta) return
    produtor.value = prod

    if (prod) {
      const listaEventos = await eventoService.listarEventosPorProdutor(id)
      if (sequenciaAtual !== sequenciaConsulta) return
      eventos.value = listaEventos
    }
  } catch (e) {
    if (sequenciaAtual !== sequenciaConsulta) return
    erro.value = 'Não foi possível carregar o perfil do produtor. Tente novamente.'
    console.error('[CulturaPMW] Erro ao carregar perfil público do produtor:', e)
  } finally {
    if (sequenciaAtual === sequenciaConsulta) carregando.value = false
  }
}

watch(() => route.params.id, () => void carregarPerfil(), { immediate: true })
onBeforeUnmount(() => { sequenciaConsulta += 1 })
</script>

<template>
  <div class="perfil-container">
    <RouterLink to="/" class="voltar-link">← Voltar para a agenda</RouterLink>

    <div v-if="carregando" class="estado-box">
      Carregando perfil do produtor...
    </div>

    <div v-else-if="erro" class="estado-box erro" role="alert">
      <p>{{ erro }}</p>
      <button type="button" class="acao-feedback" @click="carregarPerfil">Tentar novamente</button>
    </div>

    <div v-else-if="!produtor" class="estado-box">
      <h2>Perfil indisponível</h2>
      <p>O perfil deste produtor não está mais disponível na plataforma.</p>
    </div>

    <template v-else>
      <header class="produtor-header">
        <span class="tag-perfil">{{ produtor.getTipoPerfil() }}</span>
        <h1>{{ produtor.nome }}</h1>
        <p v-if="produtor.descricao" class="bio">{{ produtor.descricao }}</p>
        <p class="contato">Contato: {{ produtor.telefone }}</p>
      </header>

      <section class="eventos-produtor">
        <h2>Eventos publicados por {{ produtor.nome }}</h2>

        <div v-if="eventos.length === 0" class="estado-box">
          Nenhum evento publicado está disponível no momento.
        </div>

        <div v-else class="eventos-grid">
          <EventoCard
            v-for="evento in eventos"
            :key="evento.id"
            :evento="evento"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.perfil-container {
  display: flex;
  max-width: 1200px;
  flex-direction: column;
  gap: 24px;
  margin: 0 auto;
  padding: 28px 20px 56px;
}

.voltar-link {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  padding: 8px 16px;
  border: 1.5px solid #d0dcef;
  border-radius: 999px;
  background: rgb(255 255 255 / 85%);
  color: #08428c;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  animation: cp-fade-left 0.5s var(--ease-out) backwards;
  transition: transform var(--dur-base) var(--ease-out), border-color var(--dur-fast) ease, background-color var(--dur-fast) ease;
}

.voltar-link:hover {
  transform: translateX(-4px);
  border-color: #117cd9;
  background: #fff;
}

/* ---------- Estados ---------- */
.estado-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 52px 24px;
  border: 1px solid rgb(255 255 255 / 92%);
  border-radius: 22px;
  background: rgb(255 255 255 / 94%);
  box-shadow: var(--shadow-md);
  color: #5b7192;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  animation: cp-fade-up 0.5s var(--ease-out) backwards;
}

.estado-box h2 {
  margin: 0;
  color: #08428c;
  font-size: 22px;
  font-weight: 800;
}

.estado-box p {
  margin: 0;
}

.perfil-container > .estado-box:not(.erro):not(:has(h2))::before {
  content: '';
  width: 44px;
  height: 44px;
  border: 4px solid rgb(17 84 217 / 15%);
  border-top-color: #1154d9;
  border-radius: 50%;
  animation: cp-spin 0.8s linear infinite;
}

.estado-box.erro {
  border-color: #f0b8b8;
  color: #a32626;
  animation: cp-shake 0.45s ease backwards;
}

.acao-feedback {
  min-height: 44px;
  margin-top: 6px;
  padding: 0 20px;
  border: 1px solid #08428c;
  border-radius: 12px;
  background: var(--gradient-brand);
  box-shadow: 0 8px 20px rgb(8 66 140 / 25%);
  color: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 750;
  cursor: pointer;
  transition: transform var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}

.acao-feedback:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgb(8 66 140 / 32%);
}

/* ---------- Cabeçalho do produtor ---------- */
.produtor-header {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  column-gap: 24px;
  row-gap: 8px;
  overflow: hidden;
  padding: clamp(26px, 4vw, 40px);
  border-radius: 28px;
  background:
    radial-gradient(500px 260px at 95% 0%, rgb(111 179 255 / 45%), transparent 70%),
    linear-gradient(120deg, #08428c 0%, #1154d9 55%, #117cd9 100%);
  background-size: 100% 100%, 200% 200%;
  box-shadow: 0 22px 54px rgb(8 46 99 / 24%);
  color: #fff;
  animation:
    cp-scale-in 0.7s var(--ease-out) backwards,
    cp-gradient-pan 16s ease infinite;
}

/* Avatar ilustrado */
.produtor-header::before {
  content: '';
  grid-row: 1 / span 4;
  width: 96px;
  height: 96px;
  border: 3px solid rgb(255 255 255 / 55%);
  border-radius: 28px;
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231154d9' stroke-width='1.8' stroke-linecap='round'%3E%3Ccircle cx='12' cy='8' r='3.8'/%3E%3Cpath d='M5 19.5c1.5-3.4 4.2-5 7-5s5.5 1.6 7 5'/%3E%3C/svg%3E") center / 50px no-repeat,
    #fff;
  box-shadow: 0 12px 28px rgb(4 19 40 / 30%);
  animation: cp-pop 0.6s var(--ease-out) 0.2s backwards;
}

/* Bolha decorativa */
.produtor-header::after {
  content: '';
  position: absolute;
  z-index: -1;
  right: -80px;
  bottom: -140px;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(255 255 255 / 18%), transparent 65%);
  animation: cp-drift 12s ease-in-out infinite;
}

.tag-perfil {
  width: fit-content;
  padding: 5px 13px;
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 999px;
  background: rgb(255 255 255 / 15%);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #e2eeff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.produtor-header h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 850;
  letter-spacing: -0.03em;
  line-height: 1.1;
  text-shadow: 0 4px 20px rgb(4 19 40 / 22%);
  animation: cp-fade-up 0.6s var(--ease-out) 0.2s backwards;
}

.bio {
  max-width: 720px;
  margin: 2px 0;
  color: #dceaff;
  font-size: 15.5px;
  line-height: 1.6;
  animation: cp-fade-up 0.6s var(--ease-out) 0.3s backwards;
}

.contato {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 8px;
  margin: 6px 0 0;
  padding: 8px 14px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 6px 16px rgb(4 19 40 / 20%);
  color: #08428c;
  font-size: 14px;
  font-weight: 750;
  animation: cp-fade-up 0.6s var(--ease-out) 0.38s backwards;
}

.contato::before {
  content: '';
  width: 16px;
  height: 16px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231154d9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2'/%3E%3C/svg%3E") center / 16px no-repeat;
}

/* ---------- Eventos do produtor ---------- */
.eventos-produtor {
  animation: cp-fade-up 0.6s var(--ease-out) 0.35s backwards;
}

.eventos-produtor h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
  color: #08428c;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.eventos-produtor h2::before {
  content: '';
  width: 5px;
  height: 24px;
  border-radius: 4px;
  background: var(--gradient-brand);
}

.eventos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.eventos-grid > * {
  animation: cp-fade-up 0.55s var(--ease-out) backwards;
}

.eventos-grid > :nth-child(1) { animation-delay: 0.45s; }
.eventos-grid > :nth-child(2) { animation-delay: 0.52s; }
.eventos-grid > :nth-child(3) { animation-delay: 0.59s; }
.eventos-grid > :nth-child(4) { animation-delay: 0.66s; }
.eventos-grid > :nth-child(n + 5) { animation-delay: 0.73s; }

@media (max-width: 640px) {
  .perfil-container {
    padding: 16px 14px 40px;
  }

  .produtor-header {
    grid-template-columns: 1fr;
    border-radius: 22px;
  }

  .produtor-header::before {
    grid-row: auto;
    width: 72px;
    height: 72px;
    margin-bottom: 8px;
    border-radius: 22px;
    background-size: 38px, auto;
  }
}

/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */
html[data-theme='escuro'] .voltar-link {
  border: 1.5px solid #243b5f;
  background-image: none;
  background-color: rgb(19 27 40 / 85%);
  color: #a8c9f4;
}

html[data-theme='escuro'] .voltar-link:hover {
  border-color: #117cd9;
  background-image: none;
  background-color: #131b28;
}

html[data-theme='escuro'] .estado-box {
  border: 1px solid rgb(36 48 66 / 92%);
  background-image: none;
  background-color: rgb(19 27 40 / 94%);
  box-shadow: 0 8px 26px rgb(0 0 0 / 22%);
  color: #acb8cb;
}

html[data-theme='escuro'] .estado-box h2 {
  color: #a8c9f4;
}

html[data-theme='escuro'] .perfil-container > .estado-box:not(.erro):not(:has(h2))::before {
  border: 4px solid rgb(17 84 217 / 15%);
  border-top-color: #1154d9;
}

html[data-theme='escuro'] .estado-box.erro {
  border-color: #662727;
  color: #e89e9e;
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

html[data-theme='escuro'] .produtor-header {
  background-image: radial-gradient(500px 260px at 95% 0%, rgb(111 179 255 / 45%), transparent 70%), linear-gradient(120deg, #08428c 0%, #1154d9 55%, #117cd9 100%);
  background-color: transparent;
  box-shadow: 0 22px 54px rgb(0 0 0 / 52.8%);
  color: #ffffff;
}

html[data-theme='escuro'] .produtor-header::before {
  border: 3px solid rgb(36 48 66 / 55%);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231154d9' stroke-width='1.8' stroke-linecap='round'%3E%3Ccircle cx='12' cy='8' r='3.8'/%3E%3Cpath d='M5 19.5c1.5-3.4 4.2-5 7-5s5.5 1.6 7 5'/%3E%3C/svg%3E"), none;
  background-color: #131b28;
  box-shadow: 0 12px 28px rgb(0 0 0 / 55%);
}

html[data-theme='escuro'] .produtor-header::after {
  background-image: radial-gradient(circle, rgb(255 255 255 / 18%), transparent 65%);
  background-color: transparent;
}

html[data-theme='escuro'] .tag-perfil {
  border: 1px solid rgb(36 48 66 / 30%);
  background-image: none;
  background-color: rgb(255 255 255 / 15%);
  color: #e2eeff;
}

html[data-theme='escuro'] .produtor-header h1 {
  color: #ffffff;
  text-shadow: 0 4px 20px rgb(0 0 0 / 48.4%);
}

html[data-theme='escuro'] .bio {
  color: #dceaff;
}

html[data-theme='escuro'] .contato {
  background-image: none;
  background-color: #131b28;
  box-shadow: 0 6px 16px rgb(0 0 0 / 44%);
  color: #a8c9f4;
}

html[data-theme='escuro'] .eventos-produtor h2 {
  color: #a8c9f4;
}

html[data-theme='escuro'] .eventos-produtor h2::before {
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>