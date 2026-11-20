<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import '../../assets/styles/produtor.css'

const router = useRouter()
const senha = ref('')
const confirmarSenha = ref('')
const erro = ref('')
const sucesso = ref('')
const carregando = ref(false)

async function salvar() {
  erro.value = ''
  sucesso.value = ''
  if (senha.value !== confirmarSenha.value) {
    erro.value = 'As senhas informadas não são iguais.'
    return
  }
  carregando.value = true
  try {
    await authService.atualizarSenha(senha.value)
    sucesso.value = 'Senha atualizada com sucesso. Você já pode entrar na plataforma.'
    await authService.sair()
    window.setTimeout(() => void router.replace({ name: 'login' }), 1200)
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível atualizar a senha. Solicite um novo link.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="produtor-auth-page">
    <section class="produtor-auth-card">
      <RouterLink to="/" class="produtor-brand">Cultura<span>PMW</span></RouterLink>
      <p class="produtor-eyebrow">NOVA SENHA</p>
      <h1>Redefinir senha</h1>
      <p class="produtor-intro">Escolha uma nova senha para sua conta.</p>
      <form class="produtor-form" @submit.prevent="salvar">
        <label class="produtor-field">
          <span>Nova senha</span>
          <input v-model="senha" type="password" minlength="8" autocomplete="new-password" required placeholder="Mínimo de 8 caracteres" />
        </label>
        <label class="produtor-field">
          <span>Confirmar nova senha</span>
          <input v-model="confirmarSenha" type="password" minlength="8" autocomplete="new-password" required placeholder="Repita a nova senha" />
        </label>
        <p v-if="erro" class="produtor-alert produtor-alert-error" role="alert">{{ erro }}</p>
        <p v-if="sucesso" class="produtor-alert produtor-alert-success" role="status">{{ sucesso }}</p>
        <button class="produtor-button produtor-button-primary" type="submit" :disabled="carregando">
          {{ carregando ? 'Salvando...' : 'Salvar nova senha' }}
        </button>
      </form>
    </section>
  </main>
</template>
