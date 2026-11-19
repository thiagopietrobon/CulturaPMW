<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '../../services/AuthService'
import '../../assets/styles/produtor.css'

const email = ref('')
const erro = ref('')
const sucesso = ref('')
const carregando = ref(false)

async function enviar() {
  erro.value = ''
  sucesso.value = ''
  carregando.value = true
  try {
    await authService.enviarRecuperacaoSenha(email.value)
    sucesso.value = 'Se o endereço estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a caixa de spam.'
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível enviar o link de recuperação.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="produtor-auth-page">
    <section class="produtor-auth-card">
      <RouterLink to="/" class="produtor-brand">Cultura<span>PMW</span></RouterLink>
      <p class="produtor-eyebrow">RECUPERAÇÃO DE ACESSO</p>
      <h1>Esqueceu sua senha?</h1>
      <p class="produtor-intro">Informe o e-mail utilizado no cadastro. Enviaremos as instruções para criar uma nova senha.</p>
      <form class="produtor-form" @submit.prevent="enviar">
        <label class="produtor-field">
          <span>E-mail cadastrado</span>
          <input v-model="email" type="email" autocomplete="email" required placeholder="voce@exemplo.com" />
        </label>
        <p v-if="erro" class="produtor-alert produtor-alert-error" role="alert">{{ erro }}</p>
        <p v-if="sucesso" class="produtor-alert produtor-alert-success" role="status">{{ sucesso }}</p>
        <button class="produtor-button produtor-button-primary" type="submit" :disabled="carregando">
          {{ carregando ? 'Enviando...' : 'Enviar link de recuperação' }}
        </button>
      </form>
      <RouterLink to="/produtor/login" class="produtor-back-link">← Voltar para o login</RouterLink>
    </section>
  </main>
</template>
