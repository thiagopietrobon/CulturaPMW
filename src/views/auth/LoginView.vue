<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService, type PerfilProdutorAutenticado } from '../../services/AuthService'
import logoCulturaPMW from '../../assets/sgv/culturapmw-logo.png'
import '../../assets/styles/login-unificado.css'

const router = useRouter()
const route = useRoute()
const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const erro = ref('')
const carregando = ref(false)

function destinoProdutor(produtor: PerfilProdutorAutenticado): string {
  if (produtor.status === 'AGUARDANDO_APROVACAO') return '/produtor/aguardando-aprovacao'
  if (produtor.status === 'REPROVADO') return '/produtor/reprovado'
  if (produtor.status === 'SUSPENSO') return '/produtor/suspenso'

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  return redirect.startsWith('/produtor/') && redirect !== '/produtor/login'
    ? redirect
    : '/produtor/painel'
}

async function entrar() {
  erro.value = ''
  carregando.value = true

  try {
    const usuario = await authService.entrar(email.value, senha.value)

    if (usuario.role === 'admin') {
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
      const destino = redirect.startsWith('/admin/') || redirect === '/admin'
        ? redirect
        : '/admin'
      await router.replace(destino)
      return
    }

    await router.replace(destinoProdutor(usuario))
  } catch (error) {
    console.error('[CulturaPMW] Falha ao realizar login:', error)
    erro.value = error instanceof Error
      ? error.message
      : 'Não foi possível realizar o login. Confira seus dados e tente novamente.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card" aria-labelledby="login-title">
      <RouterLink to="/" class="login-logo-link" aria-label="CulturaPMW — voltar para a página inicial">
        <img
          class="login-logo"
          :src="logoCulturaPMW"
          alt="CulturaPMW — Eventos que conectam Palmas"
          width="560"
          height="163"
        />
      </RouterLink>

      <div class="login-divider" aria-hidden="true"></div>

      <header class="login-heading">
        <h1 id="login-title">Bem-vindo(a)!</h1>
        <p>Faça login para acessar sua conta</p>
      </header>

      <form class="login-form" @submit.prevent="entrar">
        <label class="login-field">
          <span class="login-sr-only">E-mail</span>
          <span class="login-input-wrap">
            <svg class="login-input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3.25" y="5" width="17.5" height="14" rx="2.5" />
              <path d="m4.5 7 7.5 6 7.5-6" />
            </svg>
            <input
              v-model.trim="email"
              type="email"
              name="email"
              autocomplete="username"
              inputmode="email"
              placeholder="E-mail"
              aria-label="E-mail"
              required
            />
          </span>
        </label>

        <label class="login-field">
          <span class="login-sr-only">Senha</span>
          <span class="login-input-wrap">
            <svg class="login-input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4.25" y="10" width="15.5" height="11" rx="2.2" />
              <path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3" />
              <path d="M12 14.2v2.5" />
              <circle cx="12" cy="14" r=".75" class="login-icon-fill" />
            </svg>
            <input
              v-model="senha"
              :type="mostrarSenha ? 'text' : 'password'"
              name="password"
              autocomplete="current-password"
              placeholder="Senha"
              aria-label="Senha"
              required
            />
            <button
              class="login-password-toggle"
              type="button"
              :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
              :aria-pressed="mostrarSenha"
              @click="mostrarSenha = !mostrarSenha"
            >
              <svg v-if="!mostrarSenha" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" />
                <circle cx="12" cy="12" r="2.7" />
                <path d="m3 3 18 18" />
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.5 12s3.2-6 9.5-6 9.5 6 9.5 6-3.2 6-9.5 6-9.5-6-9.5-6Z" />
                <circle cx="12" cy="12" r="2.7" />
              </svg>
            </button>
          </span>
        </label>

        <div class="login-form-tools">
          <div class="login-register-inline-group">
            <span>Não tem cadastro?</span>
            <RouterLink to="/produtor/cadastro" class="login-register-inline-link">
              Cadastre-se
            </RouterLink>
          </div>
          <RouterLink to="/produtor/recuperar-senha" class="login-forgot-link">
            Esqueci minha senha?
          </RouterLink>
        </div>

        <p v-if="erro" class="login-error" role="alert">{{ erro }}</p>

        <button class="login-submit" type="submit" :disabled="carregando">
          <svg v-if="!carregando" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17 15 12 10 7" />
            <path d="M15 12H3" />
            <path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" />
          </svg>
          <span>{{ carregando ? 'Verificando acesso...' : 'Entrar' }}</span>
        </button>
      </form>

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
    </section>
  </main>
</template>
