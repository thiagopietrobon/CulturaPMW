<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import { useAuth } from '../../composables/useAuth'
import logoCulturaPMW from '../../assets/svg/culturapmw-logo.png'
import '../../assets/styles/produtor.css'
import '../../assets/styles/produtor-area.css'
import '../../assets/styles/produtor-status.css'

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
    <section class="produtor-status-card" aria-labelledby="status-title">
      <RouterLink
        to="/"
        class="produtor-logo-link"
        aria-label="CulturaPMW — voltar para a página inicial"
      >
        <img
          class="produtor-logo"
          :src="logoCulturaPMW"
          alt="CulturaPMW — Eventos que conectam Palmas"
          width="560"
          height="163"
        />
      </RouterLink>

      <div class="produtor-divider" aria-hidden="true"></div>

      <header class="produtor-status-heading">
        <span class="produtor-status-badge is-pending">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5l3.2 1.8" />
          </svg>
          <span>Solicitação recebida</span>
        </span>

        <h1 id="status-title">Cadastro em análise</h1>
        <p class="produtor-status-lead">
          Olá, <strong>{{ perfil?.nome ?? 'produtor' }}</strong>! Sua solicitação foi registrada e está aguardando a análise da administração do CulturaPMW.
        </p>
      </header>

      <div class="produtor-status-note">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="8" r=".75" class="produtor-icon-fill" />
        </svg>
        <p>
          Enquanto o cadastro não for aprovado, você não poderá publicar ou gerenciar eventos. Você pode consultar ou atualizar seus dados cadastrais nesta área.
        </p>
      </div>

      <p v-if="mensagem" class="produtor-status-alert is-info" role="status" aria-live="polite">
        {{ mensagem }}
      </p>
      <p v-if="erro" class="produtor-status-alert is-error" role="alert">
        {{ erro }}
      </p>

      <div class="produtor-status-actions">
        <button
          class="produtor-btn-primary"
          type="button"
          :disabled="consultando || saindo"
          :aria-busy="consultando"
          @click="consultarSituacao"
        >
          <svg
            :class="{ 'is-spinning': consultando }"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          <span>{{ consultando ? 'Consultando...' : 'Consultar situação' }}</span>
        </button>

        <div class="produtor-status-secondary-grid">
          <RouterLink class="produtor-btn-secondary" to="/produtor/perfil">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.8" />
              <path d="M5 19.5c1.5-3.4 4.2-5 7-5s5.5 1.6 7 5" />
            </svg>
            <span>Ver meus dados</span>
          </RouterLink>

          <button
            class="produtor-btn-secondary is-logout"
            type="button"
            :disabled="saindo || consultando"
            @click="sair"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" />
            </svg>
            <span>{{ saindo ? 'Saindo...' : 'Encerrar sessão' }}</span>
          </button>
        </div>
        <RouterLink to="/" class="produtor-home-action">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9M9 20v-6h6v6" />
        </svg>
        <span>
          <strong>Voltar para a agenda</strong>
          <small>Ver eventos do CulturaPMW</small>
        </span>
      </RouterLink>
      </div>
    </section>
  </main>
</template>