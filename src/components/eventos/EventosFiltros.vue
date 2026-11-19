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
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.abas-periodo {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.aba-btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #334155;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
}

.aba-btn.ativa {
  background-color: #1154d9;
  border-color: #1154d9;
  color: #ffffff;
}

.controles-grid {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(150px, 1fr)) auto;
  gap: 10px;
  align-items: start;
}

.campo-input,
.campo-select,
.filtro-multiselect summary {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.92rem;
  background-color: #ffffff;
  color: #334155;
}

.filtro-multiselect {
  position: relative;
  min-width: 0;
}

.filtro-multiselect summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  list-style: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filtro-multiselect summary::-webkit-details-marker {
  display: none;
}

.filtro-multiselect summary::after {
  content: '▾';
  flex: 0 0 auto;
}

.filtro-multiselect[open] summary {
  border-color: #1154d9;
}

.opcoes-filtro {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  width: max(100%, 220px);
  max-height: 260px;
  overflow-y: auto;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.opcao-filtro {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px;
  border-radius: 6px;
  color: #334155;
  font-size: 0.9rem;
  cursor: pointer;
}

.opcao-filtro:hover {
  background: #f1f5f9;
}

.opcao-filtro input {
  width: 16px;
  height: 16px;
  accent-color: #1154d9;
}

.sem-opcoes,
.dica-filtros {
  margin: 4px 2px 0;
  color: #64748b;
  font-size: 0.78rem;
}

.btn-limpar {
  min-height: 42px;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background-color: #f8fafc;
  color: #334155;
  font-weight: 600;
  cursor: pointer;
}

.btn-limpar:hover {
  background: #e2e8f0;
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
</style>
