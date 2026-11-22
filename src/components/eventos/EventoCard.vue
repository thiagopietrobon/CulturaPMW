<script setup lang="ts">
import type { Evento } from '../../models/Evento'

defineProps<{
  evento: Evento
}>()
</script>

<template>
  <RouterLink :to="`/eventos/${evento.id}`" class="evento-card">
    <div class="card-imagem">
      <img
        v-if="evento.imagemUrl"
        :src="evento.imagemUrl"
        :alt="evento.titulo"
        loading="lazy"
      />
      <div v-else class="imagem-placeholder">
        <span>CulturaPMW</span>
      </div>
      <span class="badge-categoria">{{ evento.categoria.nome }}</span>
      <span v-if="evento.situacao === 'CONCLUIDO'" class="badge-concluido">
        Concluído
      </span>
    </div>

    <div class="card-conteudo">
      <time class="card-data">{{ evento.formatarDataInicio() }}</time>
      <h3 class="card-titulo">{{ evento.titulo }}</h3>
      <p class="card-local">{{ evento.endereco.bairro }} • {{ evento.endereco.regiao.nome }}</p>

      <div class="card-rodape">
        <span :class="['badge-valor', { gratuito: evento.gratuito }]">
          {{ evento.formatarValor() }}
        </span>
        <span class="ver-detalhes">Ver detalhes →</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.evento-card {
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 95%);
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 6px 20px rgb(8 46 99 / 8%);
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.35s var(--ease-out),
    box-shadow 0.35s var(--ease-out),
    border-color 0.35s ease;
}

.evento-card:hover {
  transform: translateY(-6px);
  border-color: #bfd7f7;
  box-shadow: 0 20px 40px rgb(8 46 99 / 16%);
}

.evento-card:focus-visible {
  outline: 3px solid rgb(17 124 217 / 45%);
  outline-offset: 3px;
}

/* ---------- Imagem ---------- */
.card-imagem {
  position: relative;
  height: 190px;
  overflow: hidden;
  background: linear-gradient(120deg, #08428c, #1154d9, #117cd9);
}

.card-imagem::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(8 32 68 / 0%) 45%, rgb(8 32 68 / 45%) 100%);
  pointer-events: none;
}

.card-imagem img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s var(--ease-out);
}

.evento-card:hover .card-imagem img {
  transform: scale(1.08);
}

.imagem-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(260px 160px at 80% 0%, rgb(111 179 255 / 45%), transparent 70%),
    linear-gradient(120deg, #08428c 0%, #1154d9 50%, #117cd9 100%);
  background-size: 100% 100%, 200% 200%;
  color: #fff;
  font-size: 20px;
  font-weight: 850;
  letter-spacing: -0.02em;
  animation: cp-gradient-pan 10s ease infinite;
}

.imagem-placeholder span {
  opacity: 0.9;
  transition: transform 0.5s var(--ease-spring);
}

.evento-card:hover .imagem-placeholder span {
  transform: scale(1.08);
}

.badge-categoria,
.badge-concluido {
  position: absolute;
  z-index: 1;
  top: 12px;
  padding: 5px 12px;
  border: 1px solid rgb(255 255 255 / 35%);
  border-radius: 999px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: 12px;
  font-weight: 750;
  letter-spacing: 0.01em;
}

.badge-categoria {
  left: 12px;
  background: rgb(17 84 217 / 78%);
  box-shadow: 0 4px 12px rgb(8 46 99 / 25%);
}

.badge-concluido {
  right: 12px;
  background: rgb(51 65 85 / 78%);
}

/* ---------- Conteúdo ---------- */
.card-conteudo {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 18px 18px 16px;
}

.card-data,
.card-local {
  display: flex;
  align-items: center;
  gap: 7px;
}

.card-data::before,
.card-local::before {
  content: '';
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 16px;
}

.card-data {
  color: #1154d9;
  font-size: 13px;
  font-weight: 750;
  text-transform: none;
}

.card-data::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231154d9' stroke-width='2' stroke-linecap='round'%3E%3Crect x='3.5' y='5' width='17' height='15' rx='2.5'/%3E%3Cpath d='M8 3v4M16 3v4M3.5 9.5h17'/%3E%3C/svg%3E");
}

.card-titulo {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: #08428c;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.015em;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  transition: color var(--dur-fast) ease;
}

.evento-card:hover .card-titulo {
  color: #1154d9;
}

.card-local {
  margin: 0;
  color: #5b7192;
  font-size: 13.5px;
}

.card-local::before {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236f83a2' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z'/%3E%3Ccircle cx='12' cy='10' r='2.3'/%3E%3C/svg%3E");
}

.card-rodape {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid #edf3fb;
}

.badge-valor {
  padding: 4px 11px;
  border: 1px solid #d5dfec;
  border-radius: 999px;
  background: #f1f5fb;
  color: #3c5478;
  font-size: 12.5px;
  font-weight: 800;
}

.badge-valor.gratuito {
  border-color: #a8dfc0;
  background: #eefbf3;
  color: #136c3e;
}

.ver-detalhes {
  color: #1154d9;
  font-size: 13.5px;
  font-weight: 750;
  transition: transform 0.3s var(--ease-out), color var(--dur-fast) ease;
}

.evento-card:hover .ver-detalhes {
  transform: translateX(5px);
  color: #08428c;
}

/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */
html[data-theme='escuro'] .evento-card {
  border: 1px solid rgb(36 48 66 / 95%);
  background-image: none;
  background-color: #131b28;
  box-shadow: 0 6px 20px rgb(0 0 0 / 17.6%);
}

html[data-theme='escuro'] .evento-card:hover {
  border-color: #253f61;
  box-shadow: 0 20px 40px rgb(0 0 0 / 35.2%);
}

html[data-theme='escuro'] .evento-card:focus-visible {
  outline: 3px solid rgb(17 124 217 / 45%);
}

html[data-theme='escuro'] .card-imagem {
  background-image: linear-gradient(120deg, #08428c, #1154d9, #117cd9);
  background-color: transparent;
}

html[data-theme='escuro'] .card-imagem::after {
  background-image: linear-gradient(180deg, rgb(8 32 68 / 0%) 45%, rgb(8 32 68 / 45%) 100%);
  background-color: transparent;
}

html[data-theme='escuro'] .imagem-placeholder {
  background-image: radial-gradient(260px 160px at 80% 0%, rgb(111 179 255 / 45%), transparent 70%), linear-gradient(120deg, #08428c 0%, #1154d9 50%, #117cd9 100%);
  background-color: transparent;
  color: #ffffff;
}

html[data-theme='escuro'] .badge-categoria,
html[data-theme='escuro'] .badge-concluido {
  border: 1px solid rgb(36 48 66 / 35%);
  color: #ffffff;
}

html[data-theme='escuro'] .badge-categoria {
  background-image: none;
  background-color: rgb(17 84 217 / 78%);
  box-shadow: 0 4px 12px rgb(0 0 0 / 55%);
}

html[data-theme='escuro'] .badge-concluido {
  background-image: none;
  background-color: rgb(51 65 85 / 78%);
}

html[data-theme='escuro'] .card-data {
  color: #88abf0;
}

html[data-theme='escuro'] .card-titulo {
  color: #a8c9f4;
}

html[data-theme='escuro'] .evento-card:hover .card-titulo {
  color: #88abf0;
}

html[data-theme='escuro'] .card-local {
  color: #acb8cb;
}

html[data-theme='escuro'] .card-rodape {
  border-top: 1px solid #1f3451;
}

html[data-theme='escuro'] .badge-valor {
  border: 1px solid #283e59;
  background-image: none;
  background-color: #111f33;
  color: #b5c4da;
}

html[data-theme='escuro'] .badge-valor.gratuito {
  border-color: #2b7149;
  background-image: none;
  background-color: #12351f;
  color: #b3f2d1;
}

html[data-theme='escuro'] .ver-detalhes {
  color: #88abf0;
}

html[data-theme='escuro'] .evento-card:hover .ver-detalhes {
  color: #a8c9f4;
}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>