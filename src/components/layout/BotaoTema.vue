<script setup lang="ts">
import { computed } from 'vue'
import { useTema } from '../../composables/useTema'

withDefaults(
  defineProps<{
    /** Botão fixo no canto da tela, para páginas sem cabeçalho. */
    flutuante?: boolean
  }>(),
  { flutuante: false }
)

const { tema, alternar } = useTema()
const escuro = computed(() => tema.value === 'escuro')
const rotulo = computed(() => (escuro.value ? 'Ativar modo claro' : 'Ativar modo escuro'))
</script>

<template>
  <button
    type="button"
    class="botao-tema"
    :class="{ 'botao-tema--flutuante': flutuante, 'is-escuro': escuro }"
    :aria-label="rotulo"
    :aria-pressed="escuro"
    :title="rotulo"
    @click="alternar($event)"
  >
    <span class="botao-tema-icones" aria-hidden="true">
      <!-- Lua: aparece no modo claro (clique para escurecer) -->
      <svg class="botao-tema-lua" viewBox="0 0 24 24">
        <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5a8.5 8.5 0 1 0 10.8 10.8z" />
        <path class="botao-tema-estrela" d="M17 4.5v3M15.5 6h3" />
      </svg>
      <!-- Sol: aparece no modo escuro (clique para clarear) -->
      <svg class="botao-tema-sol" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.6v2.1M12 19.3v2.1M4.7 4.7l1.5 1.5M17.8 17.8l1.5 1.5M2.6 12h2.1M19.3 12h2.1M4.7 19.3l1.5-1.5M17.8 6.2l1.5-1.5" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.botao-tema {
  position: relative;
  display: inline-grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  padding: 0;
  overflow: hidden;
  border: 1.5px solid #d0dcef;
  border-radius: 12px;
  background: #fff;
  color: #08428c;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease,
    box-shadow 0.25s ease,
    transform 0.25s var(--ease-out);
}

.botao-tema:hover {
  transform: translateY(-1px);
  border-color: #117cd9;
  background: #f4f9ff;
  box-shadow: 0 6px 16px rgb(8 66 140 / 14%);
}

.botao-tema:focus-visible {
  outline: 3px solid rgb(17 124 217 / 40%);
  outline-offset: 2px;
}

.botao-tema-icones {
  position: relative;
  display: block;
  width: 20px;
  height: 20px;
}

.botao-tema svg {
  position: absolute;
  inset: 0;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition:
    transform 0.55s var(--ease-spring),
    opacity 0.3s ease;
}

.botao-tema-sol {
  opacity: 0;
  transform: rotate(-90deg) scale(0.4);
}

.botao-tema.is-escuro .botao-tema-lua {
  opacity: 0;
  transform: rotate(90deg) scale(0.4);
}

.botao-tema.is-escuro .botao-tema-sol {
  opacity: 1;
  transform: none;
}

.botao-tema.is-escuro {
  color: #ffd166;
}

.botao-tema.is-escuro:hover .botao-tema-sol {
  transform: rotate(45deg);
}

.botao-tema:not(.is-escuro):hover .botao-tema-lua {
  transform: rotate(-18deg);
}

.botao-tema-estrela {
  animation: botao-tema-brilho 2.4s ease-in-out infinite;
  transform-origin: 17px 6px;
}

@keyframes botao-tema-brilho {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

/* Versão flutuante (login, cadastro, telas de status) */
.botao-tema--flutuante {
  position: fixed;
  z-index: 70;
  right: 18px;
  bottom: 18px;
  width: 50px;
  height: 50px;
  border-radius: 16px;
  box-shadow: 0 10px 28px rgb(8 46 99 / 22%);
  animation: cp-pop 0.5s var(--ease-out) 0.3s backwards;
}

@media (prefers-reduced-motion: reduce) {
  .botao-tema svg,
  .botao-tema-estrela {
    transition: none;
    animation: none;
  }
}

/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */
html[data-theme='escuro'] .botao-tema {
  border: 1.5px solid #243b5f;
  background-image: none;
  background-color: #131b28;
  color: #a8c9f4;
}

html[data-theme='escuro'] .botao-tema:hover {
  border-color: #117cd9;
  background-image: none;
  background-color: #101f31;
  box-shadow: 0 6px 16px rgb(0 0 0 / 30.8%);
}

html[data-theme='escuro'] .botao-tema:focus-visible {
  outline: 3px solid rgb(17 124 217 / 40%);
}

html[data-theme='escuro'] .botao-tema.is-escuro {
  color: #ffd166;
}

html[data-theme='escuro'] .botao-tema--flutuante {
  box-shadow: 0 10px 28px rgb(0 0 0 / 48.4%);
}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>
