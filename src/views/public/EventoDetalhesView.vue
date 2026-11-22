<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Evento } from '../../models/Evento'
import { eventoService } from '../../services/EventoService'

const route = useRoute()
const evento = ref<Evento | null>(null)
const carregando = ref(true)
const erro = ref<string | null>(null)

function formatarDataCompleta(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(data)
}

let sequenciaConsulta = 0

async function carregarEvento() {
  const sequenciaAtual = ++sequenciaConsulta
  const id = String(route.params.id ?? '')
  evento.value = null
  erro.value = null
  carregando.value = true

  try {
    evento.value = id ? await eventoService.buscarPorId(id) : null
  } catch (e) {
    if (sequenciaAtual !== sequenciaConsulta) return
    erro.value = 'Não foi possível carregar os dados do evento. Tente novamente.'
    console.error('[CulturaPMW] Erro ao carregar detalhes do evento:', e)
  } finally {
    if (sequenciaAtual === sequenciaConsulta) carregando.value = false
  }
}

// A mesma tela pode ser reutilizada quando o usuário navega entre dois eventos.
watch(() => route.params.id, () => void carregarEvento(), { immediate: true })
onBeforeUnmount(() => { sequenciaConsulta += 1 })
</script>

<template>
  <div class="detalhes-container">
    <RouterLink to="/" class="voltar-link">← Voltar para a agenda</RouterLink>

    <div v-if="carregando" class="estado-box">
      Carregando informações do evento...
    </div>

    <div v-else-if="erro" class="estado-box erro" role="alert">
      <p>{{ erro }}</p>
      <button type="button" class="acao-feedback" @click="carregarEvento">Tentar novamente</button>
    </div>

    <div v-else-if="!evento" class="estado-box">
      <h2>Conteúdo indisponível</h2>
      <p>Este evento não foi encontrado, foi removido ou não está mais disponível para consulta.</p>
      <RouterLink to="/" class="acao-feedback link-voltar">Voltar para a agenda</RouterLink>
    </div>

    <article v-else class="evento-artigo">
      <div v-if="evento.imagemUrl" class="banner">
        <img :src="evento.imagemUrl" :alt="evento.titulo" />
      </div>

      <div class="corpo">
        <div class="badges">
          <span class="badge-cat">{{ evento.categoria.nome }}</span>
          <span class="badge-regiao">{{ evento.endereco.regiao.nome }}</span>
          <span v-if="evento.situacao === 'CONCLUIDO'" class="badge-status">Concluído</span>
        </div>

        <h1>{{ evento.titulo }}</h1>

        <div class="info-grid">
          <div class="info-card">
            <strong>Data e Horário</strong>
            <p>Início: {{ formatarDataCompleta(evento.dataInicio) }}</p>
            <p>Término: {{ formatarDataCompleta(evento.dataFim) }}</p>
          </div>

          <div class="info-card">
            <strong>Entrada</strong>
            <p class="valor-destaque">{{ evento.formatarValor() }}</p>
          </div>

          <div class="info-card">
            <strong>Localização</strong>
            <p>{{ evento.endereco.getEnderecoCompleto() }}</p>
            <div class="mapas-acoes">
              <a :href="evento.endereco.gerarLinkMapa('google')" target="_blank" rel="noopener noreferrer" class="btn-mapa">
                Abrir no Google Maps
              </a>
              <a :href="evento.endereco.gerarLinkMapa('waze')" target="_blank" rel="noopener noreferrer" class="btn-mapa waze">
                Abrir no Waze
              </a>
            </div>
          </div>

          <div class="info-card">
            <strong>Organizador</strong>
            <p>{{ evento.produtor.nome }}</p>
            <RouterLink :to="`/produtores/${evento.produtor.id}`" class="link-produtor">
              Ver perfil e outros eventos do produtor →
            </RouterLink>
          </div>
        </div>

        <section class="descricao">
          <h2>Sobre o evento</h2>
          <p>{{ evento.descricao }}</p>
        </section>

        <section v-if="evento.linksExternos.length > 0" class="links-externos">
          <h2>Links Oficiais e Ingressos</h2>
          <div class="links-lista">
            <a
              v-for="link in evento.linksExternos"
              :key="link.id ?? link.url"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-externo"
            >
              {{ link.getRotulo() }} ↗
            </a>
          </div>
        </section>
      </div>
    </article>
  </div>
</template>

<style scoped>
.detalhes-container {
  display: flex;
  max-width: 1040px;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  padding: 28px 20px 56px;
}

/* ---------- Voltar ---------- */
.voltar-link {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
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
  padding: 56px 24px;
  border: 1px solid rgb(255 255 255 / 92%);
  border-radius: 24px;
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
  max-width: 480px;
  margin: 0;
}

/* Carregando: anel girando */
.detalhes-container > .estado-box:not(.erro):not(:has(h2))::before {
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
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
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
  text-decoration: none;
  cursor: pointer;
  transition: transform var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}

.acao-feedback:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgb(8 66 140 / 32%);
}

.link-voltar {
  margin-top: 10px;
}

/* ---------- Artigo ---------- */
.evento-artigo {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 95%);
  border-radius: 28px;
  background: #fff;
  box-shadow: var(--shadow-lg);
  animation: cp-scale-in 0.7s var(--ease-out) backwards;
}

/* Faixa de cor no topo (aparece quando não há banner) */
.evento-artigo::before {
  content: '';
  display: block;
  height: 6px;
  background: linear-gradient(90deg, #117cd9, #1154d9, #08428c, #117cd9);
  background-size: 300% 100%;
  animation: cp-gradient-pan 8s ease infinite;
}

.banner {
  position: relative;
  overflow: hidden;
  background: #08428c;
}

.banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgb(8 32 68 / 35%) 100%);
  pointer-events: none;
}

.banner img {
  display: block;
  width: 100%;
  max-height: 420px;
  object-fit: cover;
  animation: cp-banner-zoom 1.2s var(--ease-out) backwards;
}

@keyframes cp-banner-zoom {
  from { transform: scale(1.12); opacity: 0.4; }
  to { transform: none; opacity: 1; }
}

.corpo {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: clamp(22px, 4vw, 38px);
}

/* ---------- Badges ---------- */
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  animation: cp-fade-up 0.5s var(--ease-out) 0.15s backwards;
}

.badge-cat,
.badge-regiao,
.badge-status {
  padding: 5px 13px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 800;
}

.badge-cat {
  border-color: #08428c;
  background: var(--gradient-brand);
  box-shadow: 0 4px 12px rgb(8 66 140 / 22%);
  color: #fff;
}

.badge-regiao {
  border-color: #bfd7f7;
  background: #eef6ff;
  color: #08428c;
}

.badge-status {
  border-color: #d5dfec;
  background: #f1f5fb;
  color: #526581;
}

h1 {
  margin: 0;
  color: #08428c;
  font-size: clamp(28px, 4.2vw, 42px);
  font-weight: 850;
  letter-spacing: -0.03em;
  line-height: 1.1;
  animation: cp-fade-up 0.6s var(--ease-out) 0.2s backwards;
}

/* ---------- Cartões de informação ---------- */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.info-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 18px 18px 72px;
  border: 1px solid #e3ecf8;
  border-radius: 18px;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f7fe 100%);
  animation: cp-fade-up 0.55s var(--ease-out) backwards;
  transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) ease, border-color var(--dur-fast) ease;
}

.info-card:nth-child(1) { animation-delay: 0.25s; }
.info-card:nth-child(2) { animation-delay: 0.32s; }
.info-card:nth-child(3) { animation-delay: 0.39s; }
.info-card:nth-child(4) { animation-delay: 0.46s; }

.info-card:hover {
  transform: translateY(-3px);
  border-color: #bfd7f7;
  box-shadow: var(--shadow-md);
}

/* Ícone de cada cartão */
.info-card::before {
  content: '';
  position: absolute;
  top: 18px;
  left: 18px;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background-color: #1154d9;
  background-image: var(--icone), var(--gradient-brand);
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
  background-size: 20px, cover;
  box-shadow: 0 6px 14px rgb(8 66 140 / 24%);
}

.info-card:nth-child(1) {
  --icone: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round'%3E%3Crect x='3.5' y='5' width='17' height='15' rx='2.5'/%3E%3Cpath d='M8 3v4M16 3v4M3.5 9.5h17'/%3E%3C/svg%3E");
}

.info-card:nth-child(2) {
  --icone: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9V6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5V9a3 3 0 0 0 0 6v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5V15a3 3 0 0 0 0-6z'/%3E%3Cpath d='M14 5v14' stroke-dasharray='2 2.5'/%3E%3C/svg%3E");
}

.info-card:nth-child(3) {
  --icone: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z'/%3E%3Ccircle cx='12' cy='10' r='2.3'/%3E%3C/svg%3E");
}

.info-card:nth-child(4) {
  --icone: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='12' cy='8' r='3.8'/%3E%3Cpath d='M5 19.5c1.5-3.4 4.2-5 7-5s5.5 1.6 7 5'/%3E%3C/svg%3E");
}

.info-card strong {
  color: #6f83a2;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.info-card p {
  margin: 0;
  color: #123d78;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.45;
}

.valor-destaque {
  color: #1154d9 !important;
  font-size: 22px !important;
  font-weight: 850 !important;
  letter-spacing: -0.02em;
}

/* ---------- Mapas ---------- */
.mapas-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.btn-mapa {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  padding: 0 14px;
  border: 1px solid #08428c;
  border-radius: 11px;
  background: var(--gradient-brand);
  box-shadow: 0 6px 14px rgb(8 66 140 / 20%);
  color: #fff;
  font-size: 13px;
  font-weight: 750;
  text-decoration: none;
  transition: transform var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}

.btn-mapa:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgb(8 66 140 / 28%);
}

.btn-mapa.waze {
  border: 1.5px solid #d0dcef;
  background: #fff;
  box-shadow: none;
  color: #08428c;
}

.btn-mapa.waze:hover {
  border-color: #117cd9;
  background: #f4f9ff;
}

.link-produtor {
  width: fit-content;
  margin-top: 6px;
  color: #1154d9;
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;
  background: linear-gradient(currentColor, currentColor) left bottom / 0 2px no-repeat;
  transition: background-size var(--dur-base) var(--ease-out), color var(--dur-fast) ease;
}

.link-produtor:hover {
  color: #08428c;
  background-size: 100% 2px;
}

/* ---------- Descrição e links ---------- */
.descricao,
.links-externos {
  padding-top: 22px;
  border-top: 1px solid #edf3fb;
  animation: cp-fade-up 0.6s var(--ease-out) 0.5s backwards;
}

.descricao h2,
.links-externos h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
  color: #08428c;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.015em;
}

.descricao h2::before,
.links-externos h2::before {
  content: '';
  width: 5px;
  height: 22px;
  border-radius: 4px;
  background: var(--gradient-brand);
}

.descricao p {
  margin: 0;
  color: #3c5478;
  font-size: 16px;
  line-height: 1.75;
  white-space: pre-line;
}

.links-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn-externo {
  position: relative;
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  overflow: hidden;
  padding: 0 20px;
  border: 1px solid #08428c;
  border-radius: 14px;
  background: var(--gradient-brand);
  box-shadow: 0 8px 20px rgb(8 66 140 / 25%);
  color: #fff;
  font-size: 14.5px;
  font-weight: 750;
  text-decoration: none;
  transition: transform var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
}

.btn-externo::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgb(255 255 255 / 35%) 50%, transparent 70%);
  transform: translateX(-120%);
  transition: transform 0.6s var(--ease-out);
}

.btn-externo:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgb(8 66 140 / 32%);
}

.btn-externo:hover::after {
  transform: translateX(120%);
}

@media (max-width: 640px) {
  .detalhes-container {
    padding: 16px 14px 40px;
  }

  .evento-artigo {
    border-radius: 22px;
  }

  .info-card {
    padding-left: 18px;
    padding-top: 70px;
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

html[data-theme='escuro'] .detalhes-container > .estado-box:not(.erro):not(:has(h2))::before {
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

html[data-theme='escuro'] .evento-artigo {
  border: 1px solid rgb(36 48 66 / 95%);
  background-image: none;
  background-color: #131b28;
  box-shadow: 0 18px 48px rgb(0 0 0 / 39.6%);
}

html[data-theme='escuro'] .evento-artigo::before {
  background-image: linear-gradient(90deg, #117cd9, #1154d9, #08428c, #117cd9);
  background-color: transparent;
}

html[data-theme='escuro'] .banner {
  background-image: none;
  background-color: #08428c;
}

html[data-theme='escuro'] .banner::after {
  background-image: linear-gradient(180deg, transparent 55%, rgb(8 32 68 / 35%) 100%);
  background-color: transparent;
}

html[data-theme='escuro'] .badge-cat {
  border-color: #08428c;
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
  box-shadow: 0 4px 12px rgb(0 0 0 / 48.4%);
  color: #ffffff;
}

html[data-theme='escuro'] .badge-regiao {
  border-color: #253f61;
  background-image: none;
  background-color: #112133;
  color: #a8c9f4;
}

html[data-theme='escuro'] .badge-status {
  border-color: #283e59;
  background-image: none;
  background-color: #111f33;
  color: #b3becf;
}

html[data-theme='escuro'] h1 {
  color: #a8c9f4;
}

html[data-theme='escuro'] .info-card {
  border: 1px solid #203755;
  background-image: linear-gradient(180deg, #101d2f 0%, #111e32 100%);
  background-color: transparent;
}

html[data-theme='escuro'] .info-card:hover {
  border-color: #253f61;
  box-shadow: 0 8px 26px rgb(0 0 0 / 22%);
}

html[data-theme='escuro'] .info-card::before {
  background-color: #1154d9;
  background-image: var(--icone), linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  box-shadow: 0 6px 14px rgb(0 0 0 / 52.8%);
}

html[data-theme='escuro'] .info-card strong {
  color: #a4b0c4;
}

html[data-theme='escuro'] .info-card p {
  color: #aecbf3;
}

html[data-theme='escuro'] .valor-destaque {
  color: #88abf0 !important;
}

html[data-theme='escuro'] .btn-mapa {
  border: 1px solid #08428c;
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
  box-shadow: 0 6px 14px rgb(0 0 0 / 44%);
  color: #ffffff;
}

html[data-theme='escuro'] .btn-mapa:hover {
  box-shadow: 0 10px 20px rgb(0 0 0 / 55%);
}

html[data-theme='escuro'] .btn-mapa.waze {
  border: 1.5px solid #243b5f;
  background-image: none;
  background-color: #131b28;
  color: #a8c9f4;
}

html[data-theme='escuro'] .btn-mapa.waze:hover {
  border-color: #117cd9;
  background-image: none;
  background-color: #101f31;
}

html[data-theme='escuro'] .link-produtor {
  color: #88abf0;
}

html[data-theme='escuro'] .link-produtor:hover {
  color: #a8c9f4;
}

html[data-theme='escuro'] .descricao,
html[data-theme='escuro'] .links-externos {
  border-top: 1px solid #1f3451;
}

html[data-theme='escuro'] .descricao h2,
html[data-theme='escuro'] .links-externos h2 {
  color: #a8c9f4;
}

html[data-theme='escuro'] .descricao h2::before,
html[data-theme='escuro'] .links-externos h2::before {
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
}

html[data-theme='escuro'] .descricao p {
  color: #b5c4da;
}

html[data-theme='escuro'] .btn-externo {
  border: 1px solid #08428c;
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
  box-shadow: 0 8px 20px rgb(0 0 0 / 55%);
  color: #ffffff;
}

html[data-theme='escuro'] .btn-externo::after {
  background-image: linear-gradient(105deg, transparent 30%, rgb(255 255 255 / 35%) 50%, transparent 70%);
  background-color: transparent;
}

html[data-theme='escuro'] .btn-externo:hover {
  box-shadow: 0 12px 26px rgb(0 0 0 / 55%);
}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>