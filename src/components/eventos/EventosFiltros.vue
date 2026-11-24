<script setup lang="ts">
import { computed } from 'vue'
import type { Categoria } from '../../models/Categoria'
import type { Regiao } from '../../models/Regiao'
import type { FiltrosEventos } from '../../services/EventoService'

const props = defineProps<{
  modelValue: FiltrosEventos
  categorias: Categoria[]
  regioes: Regiao[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FiltrosEventos): void
}>()

function atualizar<K extends keyof FiltrosEventos>(campo: K, valor: FiltrosEventos[K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [campo]: valor
  })
}

function alternarSelecao(campo: 'categoriaIds' | 'regiaoIds', id: number, selecionado: boolean) {
  const atuais = props.modelValue[campo] ?? []
  const novos = selecionado
    ? [...new Set([...atuais, id])]
    : atuais.filter((valor) => valor !== id)

  atualizar(campo, novos)
}

const resumoCategorias = computed(() => {
  const quantidade = props.modelValue.categoriaIds?.length ?? 0
  if (quantidade === 0) return 'Todas as categorias'
  return `${quantidade} ${quantidade === 1 ? 'categoria selecionada' : 'categorias selecionadas'}`
})

const resumoRegioes = computed(() => {
  const quantidade = props.modelValue.regiaoIds?.length ?? 0
  if (quantidade === 0) return 'Todas as regiões'
  return `${quantidade} ${quantidade === 1 ? 'região selecionada' : 'regiões selecionadas'}`
})

function limparFiltros() {
  emit('update:modelValue', {
    busca: '',
    categoriaIds: [],
    regiaoIds: [],
    gratuito: 'todos',
    periodo: 'todos'
  })
}
</script>

<template>
  <section class="filtros-box" aria-label="Pesquisa e filtros de eventos">
    <div class="abas-periodo" aria-label="Período dos eventos">
      <button
        type="button"
        :class="['aba-btn', { ativa: (modelValue.periodo ?? 'todos') === 'todos' }]"
        :aria-pressed="(modelValue.periodo ?? 'todos') === 'todos'"
        @click="atualizar('periodo', 'todos')"
      >
        Todos os eventos
      </button>
      <button
        type="button"
        :class="['aba-btn', { ativa: modelValue.periodo === 'hoje' }]"
        :aria-pressed="modelValue.periodo === 'hoje'"
        @click="atualizar('periodo', 'hoje')"
      >
        O que fazer hoje
      </button>
      <button
        type="button"
        :class="['aba-btn', { ativa: modelValue.periodo === 'fim-de-semana' }]"
        :aria-pressed="modelValue.periodo === 'fim-de-semana'"
        @click="atualizar('periodo', 'fim-de-semana')"
      >
        Neste final de semana
      </button>
    </div>

    <div class="controles-grid">
      <input
        type="search"
        class="campo-input"
        placeholder="Buscar por evento, descrição, bairro ou produtor..."
        aria-label="Pesquisar eventos"
        :value="modelValue.busca ?? ''"
        @input="atualizar('busca', ($event.target as HTMLInputElement).value)"
      />

      <details class="filtro-multiselect">
        <summary>{{ resumoCategorias }}</summary>
        <div class="opcoes-filtro" aria-label="Selecionar categorias">
          <label v-for="cat in categorias" :key="cat.id" class="opcao-filtro">
            <input
              type="checkbox"
              :checked="modelValue.categoriaIds?.includes(cat.id) ?? false"
              @change="alternarSelecao('categoriaIds', cat.id, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ cat.nome }}</span>
          </label>
          <p v-if="categorias.length === 0" class="sem-opcoes">Nenhuma categoria disponível.</p>
        </div>
      </details>

      <details class="filtro-multiselect">
        <summary>{{ resumoRegioes }}</summary>
        <div class="opcoes-filtro" aria-label="Selecionar regiões">
          <label v-for="reg in regioes" :key="reg.id" class="opcao-filtro">
            <input
              type="checkbox"
              :checked="modelValue.regiaoIds?.includes(reg.id) ?? false"
              @change="alternarSelecao('regiaoIds', reg.id, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ reg.nome }}</span>
          </label>
          <p v-if="regioes.length === 0" class="sem-opcoes">Nenhuma região disponível.</p>
        </div>
      </details>

      <select
        class="campo-select"
        aria-label="Filtrar por gratuidade"
        :value="modelValue.gratuito ?? 'todos'"
        @change="atualizar('gratuito', ($event.target as HTMLSelectElement).value as FiltrosEventos['gratuito'])"
      >
        <option value="todos">Gratuitos e pagos</option>
        <option value="gratuitos">Somente gratuitos</option>
        <option value="pagos">Somente pagos</option>
      </select>

      <button type="button" class="btn-limpar" @click="limparFiltros">
        Limpar filtros
      </button>
    </div>
    <p class="dica-filtros">Você pode selecionar mais de uma categoria e região ao mesmo tempo.</p>
  </section>
</template>

<style scoped>
.filtros-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid rgb(255 255 255 / 95%);
  border-radius: 22px;
  background: rgb(255 255 255 / 94%);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

/* ---------- Abas de período (controle segmentado) ---------- */
.abas-periodo {
  display: flex;
  flex-wrap: wrap;
  width: fit-content;
  max-width: 100%;
  gap: 4px;
  padding: 5px;
  border: 1px solid #e3ecf8;
  border-radius: 999px;
  background: #f1f6fd;
}

.aba-btn {
  padding: 9px 18px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #3c5478;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color var(--dur-base) var(--ease-out),
    color var(--dur-fast) ease,
    box-shadow var(--dur-base) var(--ease-out),
    transform var(--dur-fast) ease;
}

.aba-btn:hover:not(.ativa) {
  background: #fff;
  color: #08428c;
}

.aba-btn:active {
  transform: scale(0.97);
}

.aba-btn.ativa {
  background: var(--gradient-brand);
  box-shadow: 0 6px 16px rgb(8 66 140 / 28%);
  color: #fff;
  animation: cp-pop 0.35s var(--ease-out);
}

/* ---------- Controles ---------- */
.controles-grid {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(150px, 1fr)) auto;
  align-items: start;
  gap: 10px;
}

.campo-input,
.campo-select,
.filtro-multiselect summary {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border: 1.5px solid #d0dcef;
  border-radius: 14px;
  outline: none;
  background-color: #fff;
  color: #123d78;
  font-size: 14px;
  font-weight: 600;
  transition: border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease, background-color var(--dur-fast) ease;
}

.campo-input:hover,
.campo-select:hover,
.filtro-multiselect summary:hover {
  border-color: #a9c4ef;
}

.campo-input:focus,
.campo-select:focus,
.filtro-multiselect[open] summary {
  border-color: #117cd9;
  box-shadow: 0 0 0 4px rgb(17 124 217 / 14%);
}

/* Lupa dentro do campo de busca */
.campo-input {
  padding-left: 44px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231154d9' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='6.5'/%3E%3Cpath d='m20 20-4.2-4.2'/%3E%3C/svg%3E");
  background-position: 15px center;
  background-repeat: no-repeat;
  background-size: 19px;
  font-weight: 500;
}

.campo-input::placeholder {
  color: #93a6c2;
}

.campo-select {
  padding-right: 38px;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2308428c' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-position: right 13px center;
  background-repeat: no-repeat;
  background-size: 16px;
  cursor: pointer;
}

/* ---------- Seleção múltipla (details/summary) ---------- */
.filtro-multiselect {
  position: relative;
  min-width: 0;
}

.filtro-multiselect summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  overflow: hidden;
  list-style: none;
  cursor: pointer;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}

.filtro-multiselect summary::-webkit-details-marker {
  display: none;
}

.filtro-multiselect summary::after {
  content: '';
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2308428c' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") center / 16px no-repeat;
  transition: transform var(--dur-base) var(--ease-out);
}

.filtro-multiselect[open] summary::after {
  transform: rotate(180deg);
}

.opcoes-filtro {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: 0;
  width: max(100%, 240px);
  max-height: 280px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #e2ebf8;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 18px 40px rgb(8 46 99 / 18%);
  transform-origin: top;
  animation: cp-fade-down 0.25s var(--ease-out) backwards;
}

.opcao-filtro {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  color: #123d78;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--dur-fast) ease, transform var(--dur-fast) ease;
}

.opcao-filtro:hover {
  background: #f1f7ff;
  transform: translateX(2px);
}

.opcao-filtro input {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  accent-color: #1154d9;
  cursor: pointer;
}

.opcao-filtro:has(input:checked) {
  background: #eaf2ff;
  color: #08428c;
}

.sem-opcoes,
.dica-filtros {
  margin: 0 4px;
  color: #6f83a2;
  font-size: 12.5px;
}

.dica-filtros {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dica-filtros::before {
  content: 'i';
  display: grid;
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  place-items: center;
  border-radius: 50%;
  background: #eaf2ff;
  color: #1154d9;
  font-size: 11px;
  font-style: italic;
  font-weight: 900;
}

/* ---------- Limpar ---------- */
.btn-limpar {
  min-height: 48px;
  padding: 0 18px;
  border: 1.5px solid #f0d0d0;
  border-radius: 14px;
  background: #fff;
  color: #a32626;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--dur-fast) ease, border-color var(--dur-fast) ease, transform var(--dur-fast) ease;
}

.btn-limpar:hover {
  transform: translateY(-1px);
  border-color: #dc8686;
  background: #fff6f6;
}

@media (max-width: 900px) {
  .controles-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .campo-input {
    grid-column: 1 / -1;
  }
}

@media (max-width: 560px) {
  .filtros-box {
    padding: 14px;
    border-radius: 18px;
  }

  .abas-periodo {
    width: 100%;
    border-radius: 16px;
  }

  .aba-btn {
    flex: 1 1 auto;
    padding: 9px 12px;
    font-size: 13px;
  }

  .controles-grid {
    grid-template-columns: 1fr;
  }

  .campo-input {
    grid-column: auto;
  }

  .opcoes-filtro {
    position: static;
    width: 100%;
    margin-top: 6px;
    box-shadow: none;
  }
}

/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */
html[data-theme='escuro'] .filtros-box {
  border: 1px solid rgb(36 48 66 / 95%);
  background-image: none;
  background-color: rgb(19 27 40 / 94%);
  box-shadow: 0 18px 48px rgb(0 0 0 / 39.6%);
}

html[data-theme='escuro'] .abas-periodo {
  border: 1px solid #203755;
  background-image: none;
  background-color: #111f33;
}

html[data-theme='escuro'] .aba-btn {
  border: 0;
  background-image: none;
  background-color: transparent;
  color: #b5c4da;
}

html[data-theme='escuro'] .aba-btn:hover:not(.ativa) {
  background-image: none;
  background-color: #131b28;
  color: #a8c9f4;
}

html[data-theme='escuro'] .aba-btn.ativa {
  background-image: linear-gradient(110deg, #117cd9 0%, #1154d9 58%, #08428c 100%);
  background-color: transparent;
  box-shadow: 0 6px 16px rgb(0 0 0 / 55%);
  color: #ffffff;
}

html[data-theme='escuro'] .campo-input,
html[data-theme='escuro'] .campo-select,
html[data-theme='escuro'] .filtro-multiselect summary {
  border: 1.5px solid #243b5f;
  outline: none;
  background-color: #131b28;
  color: #aecbf3;
}

html[data-theme='escuro'] .campo-input:hover,
html[data-theme='escuro'] .campo-select:hover,
html[data-theme='escuro'] .filtro-multiselect summary:hover {
  border-color: #29426b;
}

html[data-theme='escuro'] .campo-input:focus,
html[data-theme='escuro'] .campo-select:focus,
html[data-theme='escuro'] .filtro-multiselect[open] summary {
  border-color: #117cd9;
  box-shadow: 0 0 0 4px rgb(17 124 217 / 14%);
}

html[data-theme='escuro'] .opcoes-filtro {
  border: 1px solid #213656;
  background-image: none;
  background-color: #131b28;
  box-shadow: 0 18px 40px rgb(0 0 0 / 39.6%);
}

html[data-theme='escuro'] .opcao-filtro {
  color: #aecbf3;
}

html[data-theme='escuro'] .opcao-filtro:hover {
  background-image: none;
  background-color: #111f32;
}

html[data-theme='escuro'] .opcao-filtro input {
  accent-color: #88abf0;
}

html[data-theme='escuro'] .opcao-filtro:has(input:checked) {
  background-image: none;
  background-color: #121f35;
  color: #a8c9f4;
}

html[data-theme='escuro'] .sem-opcoes,
html[data-theme='escuro'] .dica-filtros {
  color: #a4b0c4;
}

html[data-theme='escuro'] .dica-filtros::before {
  background-image: none;
  background-color: #121f35;
  color: #88abf0;
}

html[data-theme='escuro'] .btn-limpar {
  border: 1.5px solid #5e2424;
  background-image: none;
  background-color: #131b28;
  color: #e89e9e;
}

html[data-theme='escuro'] .btn-limpar:hover {
  border-color: #dc8686;
  background-image: none;
  background-color: #301010;
}

@media (max-width: 560px) {
  html[data-theme='escuro'] .opcoes-filtro {
    box-shadow: none;
  }

}
/* ===== FIM DO TEMA ESCURO GERADO ===== */
</style>
