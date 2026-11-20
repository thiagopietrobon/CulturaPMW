<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService, type PerfilAutenticado } from '../../services/AuthService'
import '../../assets/styles/admin.css'

const router = useRouter()
const administrador = ref<PerfilAutenticado | null>(null)
const saindo = ref(false)

onMounted(async () => {
  administrador.value = await authService.administradorAtual()
})

async function sair() {
  saindo.value = true
  try {
    await authService.sair()
    await router.replace({ name: 'login' })
  } catch (error) {
    console.error(error)
    window.alert('Não foi possível encerrar a sessão.')
  } finally {
    saindo.value = false
  }
}
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <RouterLink to="/admin" class="admin-brand">
        <span class="admin-brand-mark">C</span>
        <span>
          <strong>CulturaPMW</strong>
          <small>Painel administrativo</small>
        </span>
      </RouterLink>

      <div class="admin-nav-label">GERENCIAMENTO</div>
      <nav class="admin-nav">
        <RouterLink :to="{ name: 'admin-dashboard' }" class="admin-nav-link" exact-active-class="ativo">
          <span class="admin-nav-icon">▦</span> Visão geral
        </RouterLink>
        <RouterLink :to="{ name: 'admin-produtores' }" class="admin-nav-link" active-class="ativo">
          <span class="admin-nav-icon">♙</span> Produtores
        </RouterLink>
        <RouterLink :to="{ name: 'admin-eventos' }" class="admin-nav-link" active-class="ativo">
          <span class="admin-nav-icon">▣</span> Eventos
        </RouterLink>
        <RouterLink :to="{ name: 'admin-categorias' }" class="admin-nav-link" active-class="ativo">
          <span class="admin-nav-icon">▤</span> Categorias
        </RouterLink>
      </nav>

      <div class="admin-sidebar-bottom">
        <RouterLink to="/" class="admin-back-public">← Voltar ao site</RouterLink>
        <div class="admin-user">
          <div class="admin-avatar">{{ administrador?.nome?.charAt(0)?.toUpperCase() ?? 'A' }}</div>
          <div class="admin-user-info">
            <strong>{{ administrador?.nome ?? 'Administrador' }}</strong>
            <small>{{ administrador?.email ?? 'Sessão administrativa' }}</small>
          </div>
        </div>
        <button class="admin-logout" type="button" :disabled="saindo" @click="sair">
          {{ saindo ? 'Saindo...' : 'Encerrar sessão' }}
        </button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-topbar">
        <span>Área administrativa</span>
        <span class="admin-topbar-status"><i></i> Painel protegido</span>
      </header>
      <div class="admin-content">
        <RouterView />
      </div>
    </main>
  </div>
</template>
