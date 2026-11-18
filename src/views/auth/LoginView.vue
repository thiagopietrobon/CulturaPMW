<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import '../../assets/styles/produtor.css'

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
    const produtor = await authService.entrarComoProdutor(email.value, senha.value)
    const destino = typeof route.query.redirect === 'string' ? route.query.redirect : '/produtor/painel'
    if (produtor.status === 'AGUARDANDO_APROVACAO') {
      await router.replace({ name: 'produtor-status' })
    } else if (produtor.status === 'REPROVADO') {
      await router.replace({ name: 'produtor-reprovado' })
    } else if (produtor.status === 'SUSPENSO') {
      await router.replace({ name: 'produtor-suspenso' })
    } else {
      await router.replace(destino)
    }
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error ? error.message : 'E-mail ou senha inválidos. Confira suas credenciais.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="produtor-auth-page">
    <section class="produtor-auth-card">
      <RouterLink to="/" class="produtor-brand">Cultura<span>PMW</span></RouterLink>
      <p class="produtor-eyebrow">ÁREA DO PRODUTOR</p>
      <h1>Entrar na plataforma</h1>
      <p class="produtor-intro">Acesse sua conta para acompanhar seu cadastro e gerenciar suas informações.</p>

      <form class="produtor-form" @submit.prevent="entrar">
        <label class="produtor-field">
          <span>E-mail</span>
          <input v-model="email" type="email" autocomplete="username" required placeholder="voce@exemplo.com" />
        </label>
        <label class="produtor-field">
          <span>Senha</span>
          <input v-model="senha" type="password" autocomplete="current-password" required placeholder="Sua senha" />
        </label>
        <div class="produtor-form-inline"><RouterLink to="/produtor/recuperar-senha">Esqueci minha senha</RouterLink></div>
        <p v-if="erro" class="produtor-alert produtor-alert-error" role="alert">{{ erro }}</p>
        <button class="produtor-button produtor-button-primary" type="submit" :disabled="carregando">
          {{ carregando ? 'Verificando...' : 'Entrar' }}
        </button>
      </form>

      <p class="produtor-auth-footer">Ainda não possui cadastro? <RouterLink to="/produtor/cadastro">Cadastre-se como produtor</RouterLink></p>
      <RouterLink to="/" class="produtor-back-link">← Voltar para a agenda</RouterLink>
    </section>
  </main>
</template>
