<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '../../services/AuthService'
import logoCulturaPMW from '../../assets/svg/culturapmw-logo.png'
import '../../assets/styles/auth-senha.css'

const email = ref('')
const erro = ref('')
const sucesso = ref('')
const carregando = ref(false)

async function enviar() {
  erro.value = ''
  sucesso.value = ''

  const emailNormalizado = email.value.trim()
  if (!emailNormalizado) {
    erro.value = 'Informe o e-mail utilizado no cadastro.'
    return
  }

  carregando.value = true

  try {
    await authService.enviarRecuperacaoSenha(emailNormalizado)
    sucesso.value = 'Se o endereço estiver cadastrado, você receberá um link para redefinir sua senha. Verifique também a caixa de spam.'
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error
      ? error.message
      : 'Não foi possível enviar o link de recuperação. Tente novamente.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="senha-auth-page">
    <section class="senha-auth-card" aria-labelledby="recuperacao-senha-titulo">
      <RouterLink to="/" class="senha-auth-logo-link" aria-label="CulturaPMW — voltar ao início">
        <img
          class="senha-auth-logo"
          :src="logoCulturaPMW"
          alt="CulturaPMW — Eventos que conectam Palmas"
          width="560"
          height="163"
        />
      </RouterLink>

      <hr class="senha-auth-divider" />

      <header class="senha-auth-heading">
        <span class="senha-auth-eyebrow">RECUPERAÇÃO DE ACESSO</span>
        <h1 id="recuperacao-senha-titulo">Esqueceu sua senha?</h1>
        <p>Informe o e-mail utilizado no cadastro. Enviaremos as instruções para criar uma nova senha.</p>
      </header>

      <form class="senha-auth-form" @submit.prevent="enviar">
        <div class="senha-auth-field">
          <label for="email-recuperacao">E-mail cadastrado</label>
          <div class="senha-auth-input-wrap" :class="{ 'is-invalid': Boolean(erro) }">
            <input
              id="email-recuperacao"
              v-model="email"
              type="email"
              name="email"
              autocomplete="email"
              inputmode="email"
              required
              placeholder="voce@exemplo.com"
              :aria-invalid="Boolean(erro)"
              :aria-describedby="erro ? 'recuperacao-erro' : 'recuperacao-ajuda'"
            />
          </div>
          <small id="recuperacao-ajuda" class="senha-auth-hint">
            Use o mesmo endereço de e-mail informado no seu cadastro.
          </small>
        </div>

        <p
          v-if="erro"
          id="recuperacao-erro"
          class="senha-auth-alert senha-auth-alert-error"
          role="alert"
        >
          {{ erro }}
        </p>

        <div
          v-if="sucesso"
          class="senha-auth-alert senha-auth-alert-success"
          role="status"
          aria-live="polite"
        >
          <strong>Solicitação enviada!</strong>
          <p>{{ sucesso }}</p>
        </div>

        <button class="senha-auth-submit" type="submit" :disabled="carregando">
          {{ carregando ? 'Enviando...' : 'Enviar link de recuperação' }}
        </button>
      </form>

      <footer class="cadastro-footer" aria-label="Navegação">
        <RouterLink to="/login" class="cadastro-footer-action cadastro-login-action">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17l5-5-5-5M15 12H3" />
            <path d="M13 4h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-5" />
          </svg>
          <span>
            <strong>Já possui cadastro?</strong>
            <small>Entrar na plataforma</small>
          </span>
        </RouterLink>

        <RouterLink to="/" class="cadastro-footer-action cadastro-home-action">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 10 9-7 9 7" />
            <path d="M5 9v11h14V9M9 20v-6h6v6" />
          </svg>
          <span>
            <strong>Voltar para a agenda</strong>
            <small>Ver eventos do CulturaPMW</small>
          </span>
        </RouterLink>
      </footer>
    </section>
  </main>
</template>
