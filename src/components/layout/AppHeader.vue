<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { perfil, autenticado, carregando } = useAuth()
const rotaAreaProdutor = computed(() => {
  if (perfil.value?.status === 'REPROVADO') return '/produtor/reprovado'
  if (perfil.value?.status === 'SUSPENSO') return '/produtor/suspenso'
  if (perfil.value?.status === 'AGUARDANDO_APROVACAO') return '/produtor/aguardando-aprovacao'
  return '/produtor/painel'
})

async function sair() {
  try {
    await authService.sair()
    await router.push('/')
  } catch (error) {
    console.error(error)
    window.alert('Não foi possível encerrar a sessão. Tente novamente.')
  }
}
</script>

<template>
  <header class="header">
    <div class="container header-content">
      <RouterLink to="/" class="brand">
        <span class="brand-name">CulturaPMW</span>
        <span class="brand-description">Cultura, esporte e lazer em Palmas</span>
      </RouterLink>

      <nav class="navigation">
        <RouterLink to="/" class="nav-link">Início</RouterLink>
        <a href="/#eventos" class="nav-link">Eventos</a>
        <a href="/#sobre" class="nav-link">Sobre</a>
      </nav>

      <div class="header-account">
        <template v-if="autenticado && perfil">
          <RouterLink :to="rotaAreaProdutor" class="header-button">
            Minha área
          </RouterLink>
          <button class="header-account-link" type="button" @click="sair">Sair</button>
        </template>
        <template v-else-if="!carregando">
          <RouterLink to="/produtor/login" class="header-account-link">Entrar</RouterLink>
          <RouterLink to="/produtor/cadastro" class="header-button">Sou produtor</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header { background-color: var(--color-surface); border-bottom: 1px solid var(--color-border); }
.container { width: min(1120px, calc(100% - 40px)); margin: 0 auto; }
.header-content { min-height: 82px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.brand { display: flex; flex-direction: column; }
.brand-name { color: var(--color-primary); font-size: 24px; font-weight: 700; }
.brand-description { color: var(--color-text-muted); font-size: 12px; }
.navigation { display: flex; align-items: center; gap: 28px; }
.nav-link { color: var(--color-text); font-size: 14px; transition: color .2s; }
.nav-link:hover { color: var(--color-primary); }
.header-account { display: flex; align-items: center; gap: 13px; }
.header-button { padding: 10px 18px; background-color: var(--color-primary); color: var(--color-surface); border: 0; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; }
.header-button:hover { background-color: var(--color-secondary); }
.header-account-link { border: 0; background: transparent; color: var(--color-text); font-size: 13px; font-weight: 600; cursor: pointer; }
.header-account-link:hover { color: var(--color-primary); }
@media (max-width: 760px) {
  .header-content { flex-wrap: wrap; justify-content: center; padding: 14px 0; gap: 13px 20px; }
  .brand { width: 100%; align-items: center; }
  .navigation { gap: 16px; }
  .header-account { width: 100%; justify-content: center; }
}
</style>
