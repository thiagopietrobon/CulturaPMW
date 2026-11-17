<script setup lang="ts">
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

function limparFiltros() {
  emit('update:modelValue', {
    busca: '',
    categoriaId: null,
    regiaoId: null,
    gratuito: 'todos',
    periodo: 'todos'
  })
}
</script>

<template>
  <section class="filtros-box">
    <div class="abas-periodo">
      <button
        type="button"
        :class="['aba-btn', { ativa: (modelValue.periodo ?? 'todos') === 'todos' }]"
        @click="atualizar('periodo', 'todos')"
      >
        Todos os eventos
      </button>
      <button
        type="button"
        :class="['aba-btn', { ativa: modelValue.periodo === 'hoje' }]"
        @click="atualizar('periodo', 'hoje')"
      >
        O que fazer hoje
      </button>
      <button
        type="button"
        :class="['aba-btn', { ativa: modelValue.periodo === 'fim-de-semana' }]"
        @click="atualizar('periodo', 'fim-de-semana')"
      >
        Neste final de semana
      </button>
    </div>

    <div class="controles-grid">
      <input
        type="search"
        class="campo-input"
        placeholder="Buscar por nome, descrição ou bairro..."
        :value="modelValue.busca ?? ''"
        @input="atualizar('busca', ($event.target as HTMLInputElement).value)"
      />

      <select
        class="campo-select"
        :value="modelValue.categoriaId ?? ''"
        @change="atualizar('categoriaId', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
      >
        <option value="">Todas as categorias</option>
        <option v-for="cat in categorias" :key="cat.id" :value="cat.id">
          {{ cat.nome }}
        </option>
      </select>

      <select
        class="campo-select"
        :value="modelValue.regiaoId ?? ''"
        @change="atualizar('regiaoId', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)"
      >
        <option value="">Todas as regiões de Palmas</option>
        <option v-for="reg in regioes" :key="reg.id" :value="reg.id">
          {{ reg.nome }}
        </option>
      </select>

      <select
        class="campo-select"
        :value="modelValue.gratuito ?? 'todos'"
        @change="atualizar('gratuito', ($event.target as HTMLSelectElement).value as FiltrosEventos['gratuito'])"
      >
        <option value="todos">Gratuitos e pagos</option>
        <option value="gratuitos">Somente gratuitos</option>
        <option value="pagos">Somente pagos</option>
      </select>

      <button type="button" class="btn-limpar" @click="limparFiltros">
        Limpar
      </button>
    </div>
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
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 10px;
}

.campo-input,
.campo-select {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.92rem;
  background-color: #ffffff;
}

.btn-limpar {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background-color: #f8fafc;
  color: #334155;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 900px) {
  .controles-grid {
    grid-template-columns: 1fr;
  }
}
</style>