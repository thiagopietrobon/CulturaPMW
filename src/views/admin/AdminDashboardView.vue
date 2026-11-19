<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminService } from '../../services/AdminService'

const resumo = ref({ totalProdutores: 0, produtoresPendentes: 0, totalEventos: 0, totalCategorias: 0 })
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    resumo.value = await adminService.obterResumo()
  } catch (error) {
    console.error(error)
    erro.value = 'Não foi possível carregar os indicadores. Verifique as permissões do Supabase.'
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <div class="admin-eyebrow">CULTURAPMW / INÍCIO</div>
        <h1>Visão geral</h1>
        <p>Acompanhe os cadastros e conteúdos da plataforma.</p>
      </div>
    </div>

    <div v-if="erro" class="admin-alert admin-alert-error">{{ erro }}</div>
    <div v-if="carregando" class="admin-panel admin-loading">Carregando indicadores...</div>

    <div v-else class="admin-stats-grid">
      <article class="admin-stat-card">
        <span class="admin-stat-label">Produtores cadastrados</span>
        <strong>{{ resumo.totalProdutores }}</strong>
        <RouterLink :to="{ name: 'admin-produtores' }">Ver produtores →</RouterLink>
      </article>
      <article class="admin-stat-card stat-warning">
        <span class="admin-stat-label">Aguardando aprovação</span>
        <strong>{{ resumo.produtoresPendentes }}</strong>
        <RouterLink :to="{ name: 'admin-produtores', query: { status: 'AGUARDANDO_APROVACAO' } }">Analisar solicitações →</RouterLink>
      </article>
      <article class="admin-stat-card">
        <span class="admin-stat-label">Eventos cadastrados</span>
        <strong>{{ resumo.totalEventos }}</strong>
        <RouterLink :to="{ name: 'admin-eventos' }">Moderar eventos →</RouterLink>
      </article>
      <article class="admin-stat-card">
        <span class="admin-stat-label">Categorias</span>
        <strong>{{ resumo.totalCategorias }}</strong>
        <RouterLink :to="{ name: 'admin-categorias' }">Gerenciar categorias →</RouterLink>
      </article>
    </div>

    <div class="admin-section-heading"><h2>Ações administrativas</h2></div>
    <div class="admin-quick-grid">
      <RouterLink :to="{ name: 'admin-produtores', query: { status: 'AGUARDANDO_APROVACAO' } }" class="admin-quick-card">
        <span class="admin-quick-icon">♙</span>
        <strong>Revisar produtores</strong>
        <small>Aprove ou reprove solicitações de cadastro.</small>
      </RouterLink>
      <RouterLink :to="{ name: 'admin-eventos' }" class="admin-quick-card">
        <span class="admin-quick-icon">▣</span>
        <strong>Moderar eventos</strong>
        <small>Corrija informações ou remova publicações.</small>
      </RouterLink>
      <RouterLink :to="{ name: 'admin-categorias' }" class="admin-quick-card">
        <span class="admin-quick-icon">▤</span>
        <strong>Organizar categorias</strong>
        <small>Mantenha a classificação dos eventos atualizada.</small>
      </RouterLink>
    </div>
  </section>
</template>
