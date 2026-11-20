<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService, type PerfilProdutorAutenticado } from '../../services/AuthService'
import '../../assets/styles/produtor.css'

const router = useRouter()
const route = useRoute()
const email = ref('')
const senha = ref('')
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
  <main class="produtor-auth-page">
    <section class="produtor-auth-card">
      <RouterLink to="/" class="produtor-brand">Cultura<span>PMW</span></RouterLink>
      <p class="produtor-eyebrow">ACESSO À PLATAFORMA</p>
      <h1>Entrar no CulturaPMW</h1>
      <p class="produtor-intro">Informe seu e-mail e sua senha. Identificaremos seu perfil e direcionaremos você à área correspondente.</p>

      <form class="produtor-form" @submit.prevent="entrar">
        <label class="produtor-field">
          <span>E-mail</span>
          <input v-model="email" type="email" autocomplete="username" required placeholder="voce@exemplo.com" />
        </label>
        <label class="produtor-field">
          <span>Senha</span>
          <input v-model="senha" type="password" autocomplete="current-password" required placeholder="Sua senha" />
        </label>
        <div class="produtor-form-inline">
          <RouterLink to="/produtor/recuperar-senha">Esqueci minha senha</RouterLink>
        </div>
        <p v-if="erro" class="produtor-alert produtor-alert-error" role="alert">{{ erro }}</p>
        <button class="produtor-button produtor-button-primary" type="submit" :disabled="carregando">
          {{ carregando ? 'Verificando acesso...' : 'Entrar' }}
        </button>
      </form>

      <p class="produtor-auth-footer">Ainda não possui cadastro? <RouterLink to="/produtor/cadastro">Cadastre-se como produtor</RouterLink></p>
      <RouterLink to="/" class="produtor-back-link">← Voltar para a agenda</RouterLink>
    </section>
  </main>
</template>
