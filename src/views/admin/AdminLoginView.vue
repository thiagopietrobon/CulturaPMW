<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import '../../assets/styles/admin.css'

const router = useRouter()
const route = useRoute()
const email = ref('')
const senha = ref('')
const erro = ref('')
const carregando = ref(false)

async function entrar() {
  erro.value = ''
  carregando.value = true
  try {
    await authService.entrarComoAdministrador(email.value.trim(), senha.value)
    const destino = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
    await router.replace(destino)
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error
      ? error.message
      : 'Não foi possível realizar o login. Confira seus dados e tente novamente.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="admin-login-page">
    <section class="admin-login-card">
      <RouterLink to="/" class="admin-login-brand">Cultura<span>PMW</span></RouterLink>
      <div class="admin-login-kicker">ACESSO RESTRITO</div>
      <h1>Entrar na administração</h1>
      <p class="admin-login-description">Utilize uma conta com perfil de administrador para acessar o painel.</p>

      <form class="admin-form" @submit.prevent="entrar">
        <label for="admin-email">E-mail</label>
        <input id="admin-email" v-model="email" type="email" autocomplete="username" required placeholder="admin@exemplo.com" />

        <label for="admin-password">Senha</label>
        <input id="admin-password" v-model="senha" type="password" autocomplete="current-password" required placeholder="Sua senha" />

        <p v-if="erro" class="admin-alert admin-alert-error">{{ erro }}</p>
        <button class="admin-button admin-button-primary admin-button-full" type="submit" :disabled="carregando">
          {{ carregando ? 'Verificando acesso...' : 'Entrar no painel' }}
        </button>
      </form>
      <RouterLink to="/" class="admin-login-back">← Voltar para a agenda</RouterLink>
    </section>
  </main>
</template>
