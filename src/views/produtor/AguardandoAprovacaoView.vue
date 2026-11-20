<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import { useAuth } from '../../composables/useAuth'
import '../../assets/styles/produtor.css'

const router = useRouter()
const { perfil, atualizarPerfil } = useAuth()
const consultando = ref(false)
const saindo = ref(false)
const erro = ref('')
const mensagem = ref('')

async function consultarSituacao() {
  consultando.value = true
  erro.value = ''
  mensagem.value = ''

  try {
    // Força uma nova leitura no Supabase, evitando reutilizar uma consulta
    // iniciada anteriormente pelo carregamento global da sessão.
    const produtor = await atualizarPerfil(true)
    if (!produtor) {
      throw new Error('Não foi possível localizar seu cadastro. Saia da conta e entre novamente.')
    }

    if (produtor.status === 'APROVADO') {
      await router.replace({ name: 'produtor-painel' })
    } else if (produtor.status === 'REPROVADO') {
      await router.replace({ name: 'produtor-reprovado' })
    } else if (produtor.status === 'SUSPENSO') {
      await router.replace({ name: 'produtor-suspenso' })
    } else {
      mensagem.value = 'Sua solicitação ainda está em análise. Consulte novamente mais tarde.'
    }
  } catch (error) {
    console.error('[CulturaPMW] Falha ao consultar a situação do produtor:', error)
    erro.value = 'Não foi possível consultar sua situação agora. Verifique sua conexão e tente novamente.'
  } finally {
    consultando.value = false
  }
}

async function sair() {
  saindo.value = true
  erro.value = ''
  try {
    await authService.sair()
      await router.replace({ name: 'login' })
  } catch (error) {
    console.error('[CulturaPMW] Falha ao encerrar sessão:', error)
    erro.value = 'Não foi possível encerrar sua sessão. Tente novamente.'
  } finally {
    saindo.value = false
  }
}
</script>

<template>
  <main class="produtor-status-page">
    <section class="produtor-status-card">
      <RouterLink to="/" class="produtor-brand">Cultura<span>PMW</span></RouterLink>
      <div class="produtor-status-icon">⌛</div>
      <p class="produtor-eyebrow">SOLICITAÇÃO RECEBIDA</p>
      <h1>Cadastro em análise</h1>
      <p>Olá, <strong>{{ perfil?.nome ?? 'produtor' }}</strong>! Sua solicitação foi registrada e está aguardando a análise da administração do CulturaPMW.</p>
      <p>Enquanto o cadastro não for aprovado, você não poderá publicar ou gerenciar eventos. Você pode consultar seus dados cadastrais nesta área.</p>

      <p v-if="mensagem" class="produtor-alert produtor-alert-info" role="status">{{ mensagem }}</p>
      <p v-if="erro" class="produtor-alert produtor-alert-error" role="alert">{{ erro }}</p>

      <div class="produtor-status-actions">
        <button class="produtor-button produtor-button-primary" type="button" :disabled="consultando" @click="consultarSituacao">
          {{ consultando ? 'Consultando...' : 'Consultar situação' }}
        </button>
        <RouterLink class="produtor-button produtor-button-secondary" to="/produtor/perfil">Ver meus dados</RouterLink>
        <RouterLink class="produtor-button produtor-button-secondary" to="/">Voltar para a agenda</RouterLink>
        <button class="produtor-button produtor-button-secondary" type="button" :disabled="saindo" @click="sair">
          {{ saindo ? 'Saindo...' : 'Encerrar sessão' }}
        </button>
      </div>
    </section>
  </main>
</template>
