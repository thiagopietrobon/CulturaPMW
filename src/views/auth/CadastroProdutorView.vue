<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import '../../assets/styles/produtor.css'

const router = useRouter()
const nome = ref('')
const email = ref('')
const cpfCnpj = ref('')
const telefone = ref('')
const descricao = ref('')
const senha = ref('')
const confirmarSenha = ref('')
const erro = ref('')
const sucesso = ref('')
const carregando = ref(false)

async function cadastrar() {
  erro.value = ''
  sucesso.value = ''
  if (senha.value !== confirmarSenha.value) {
    erro.value = 'As senhas informadas não são iguais.'
    return
  }

  carregando.value = true
  try {
    const resultado = await authService.cadastrarProdutor({
      nome: nome.value,
      email: email.value,
      cpfCnpj: cpfCnpj.value,
      telefone: telefone.value,
      descricao: descricao.value,
      senha: senha.value
    })

    if (resultado.aguardandoConfirmacaoEmail) {
      sucesso.value = 'Solicitação registrada! Confira seu e-mail e confirme o endereço para concluir o cadastro. Depois, você poderá entrar e acompanhar a análise do administrador.'
    } else {
      await router.replace({ name: 'produtor-status' })
    }
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível enviar sua solicitação. Tente novamente.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="produtor-auth-page">
    <section class="produtor-auth-card produtor-auth-card-wide">
      <RouterLink to="/" class="produtor-brand">Cultura<span>PMW</span></RouterLink>
      <p class="produtor-eyebrow">CADASTRO DE PRODUTOR</p>
      <h1>Solicite seu acesso</h1>
      <p class="produtor-intro">Preencha seus dados para solicitar o cadastro na plataforma. Sua solicitação será analisada pela administração.</p>

      <div v-if="sucesso" class="produtor-alert produtor-alert-success" role="status">
        {{ sucesso }}
        <RouterLink class="produtor-alert-link" to="/produtor/login">Ir para o login</RouterLink>
      </div>

      <form v-else class="produtor-form" @submit.prevent="cadastrar">
        <div class="produtor-form-grid">
          <label class="produtor-field produtor-field-full">
            <span>Nome completo ou razão social *</span>
            <input v-model="nome" type="text" autocomplete="name" maxlength="120" required placeholder="Como deseja ser identificado" />
          </label>
          <label class="produtor-field">
            <span>E-mail *</span>
            <input v-model="email" type="email" autocomplete="email" maxlength="160" required placeholder="voce@exemplo.com" />
          </label>
          <label class="produtor-field">
            <span>CPF ou CNPJ *</span>
            <input v-model="cpfCnpj" type="text" inputmode="numeric" maxlength="18" required placeholder="Somente números ou com pontuação" />
          </label>
          <label class="produtor-field">
            <span>Telefone com DDD *</span>
            <input v-model="telefone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required placeholder="(63) 99999-9999" />
          </label>
          <label class="produtor-field produtor-field-full">
            <span>Descrição do produtor</span>
            <textarea v-model="descricao" rows="3" maxlength="600" placeholder="Conte um pouco sobre você ou sua organização (opcional)"></textarea>
          </label>
          <label class="produtor-field">
            <span>Senha *</span>
            <input v-model="senha" type="password" autocomplete="new-password" minlength="8" required placeholder="Mínimo de 8 caracteres" />
          </label>
          <label class="produtor-field">
            <span>Confirmar senha *</span>
            <input v-model="confirmarSenha" type="password" autocomplete="new-password" minlength="8" required placeholder="Repita sua senha" />
          </label>
        </div>

        <p class="produtor-form-note">* Campos obrigatórios. O cadastro ficará aguardando aprovação e não permitirá publicar eventos até a liberação pela administração.</p>
        <p v-if="erro" class="produtor-alert produtor-alert-error" role="alert">{{ erro }}</p>
        <button class="produtor-button produtor-button-primary" type="submit" :disabled="carregando">
          {{ carregando ? 'Enviando solicitação...' : 'Enviar solicitação de cadastro' }}
        </button>
      </form>

      <p class="produtor-auth-footer">Já possui cadastro? <RouterLink to="/produtor/login">Entrar</RouterLink></p>
      <RouterLink to="/" class="produtor-back-link">← Voltar para a agenda</RouterLink>
    </section>
  </main>
</template>
