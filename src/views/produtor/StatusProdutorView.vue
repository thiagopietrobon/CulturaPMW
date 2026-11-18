<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import { useAuth } from '../../composables/useAuth'
import '../../assets/styles/produtor.css'

const router = useRouter()
const { perfil } = useAuth()
const saindo = ref(false)

async function sair() {
  saindo.value = true
  try {
    await authService.sair()
    await router.replace({ name: 'produtor-login' })
  } finally {
    saindo.value = false
  }
}
</script>

<template>
  <main class="produtor-status-page">
    <section class="produtor-status-card">
      <div class="produtor-status-icon">{{ perfil?.status === 'SUSPENSO' ? '⏸' : '!' }}</div>
      <p class="produtor-eyebrow">SITUAÇÃO DO CADASTRO</p>
      <h1>{{ perfil?.status === 'SUSPENSO' ? 'Conta temporariamente suspensa' : 'Cadastro não aprovado' }}</h1>
      <p v-if="perfil?.status === 'SUSPENSO'">O acesso às funcionalidades de publicação e gerenciamento está suspenso. {{ perfil.suspenso_ate ? `A suspensão está prevista até ${new Date(perfil.suspenso_ate).toLocaleString('pt-BR')}.` : 'Entre em contato com a administração para obter mais informações.' }}</p>
      <p v-else>Seu cadastro não foi aprovado pela administração. Entre em contato com a equipe do CulturaPMW para obter orientações.</p>
      <div class="produtor-status-actions">
        <RouterLink class="produtor-button produtor-button-secondary" to="/produtor/perfil">Consultar meus dados</RouterLink>
        <button class="produtor-button produtor-button-primary" type="button" :disabled="saindo" @click="sair">{{ saindo ? 'Saindo...' : 'Encerrar sessão' }}</button>
      </div>
    </section>
  </main>
</template>
