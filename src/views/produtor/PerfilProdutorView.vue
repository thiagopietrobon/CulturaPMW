<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService, type PerfilProdutorAutenticado } from '../../services/AuthService'
import { useAuth } from '../../composables/useAuth'
import '../../assets/styles/produtor.css'

const router = useRouter()
const { atualizarPerfil } = useAuth()
const perfil = ref<PerfilProdutorAutenticado | null>(null)
const formulario = reactive({ nome: '', email: '', cpfCnpj: '', telefone: '', descricao: '' })
const carregando = ref(true)
const salvando = ref(false)
const excluindo = ref(false)
const modoEdicao = ref(false)
const erro = ref('')
const sucesso = ref('')


function rotaRetornoPerfil(): string {
  if (perfil.value?.status === 'APROVADO') return '/produtor/painel'
  if (perfil.value?.status === 'REPROVADO') return '/produtor/reprovado'
  if (perfil.value?.status === 'SUSPENSO') return '/produtor/suspenso'
  return '/produtor/aguardando-aprovacao'
}

function preencher(dados: PerfilProdutorAutenticado) {
  formulario.nome = dados.nome
  formulario.email = dados.email
  formulario.cpfCnpj = dados.cpf_cnpj
  formulario.telefone = dados.telefone
  formulario.descricao = dados.descricao ?? ''
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    perfil.value = await authService.produtorAtual()
    if (!perfil.value) throw new Error('Não foi possível localizar seu cadastro.')
    preencher(perfil.value)
  } catch (error) {
    erro.value = error instanceof Error ? error.message : 'Não foi possível carregar seus dados.'
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  erro.value = ''
  sucesso.value = ''
  salvando.value = true
  try {
    const resultado = await authService.atualizarPerfilProdutor({ ...formulario })
    await carregar()
    modoEdicao.value = false
    sucesso.value = resultado.emailPendente
      ? 'Dados atualizados. A alteração do e-mail foi solicitada; confirme a mensagem enviada, caso o Supabase exija essa etapa.'
      : 'Seus dados foram atualizados com sucesso.'
    await atualizarPerfil()
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível atualizar seus dados. Tente novamente.'
  } finally {
    salvando.value = false
  }
}

function cancelarEdicao() {
  if (perfil.value) preencher(perfil.value)
  modoEdicao.value = false
  erro.value = ''
}

async function excluirConta() {
  const confirmado = window.confirm('Deseja realmente excluir sua conta? Todos os seus eventos e dados associados também serão removidos. Esta ação não pode ser desfeita.')
  if (!confirmado) return

  excluindo.value = true
  erro.value = ''
  try {
    await authService.excluirPropriaConta()
    window.alert('Sua conta e os eventos associados foram excluídos com sucesso.')
    await router.replace({ name: 'home' })
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível excluir a conta. Seus dados foram mantidos.'
  } finally {
    excluindo.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="produtor-area-page">
    <div class="produtor-area-heading">
      <div>
        <p class="produtor-eyebrow">ÁREA DO PRODUTOR / PERFIL</p>
        <h1>Meus dados cadastrais</h1>
        <p>Consulte as informações utilizadas no seu cadastro.</p>
      </div>
      <RouterLink class="produtor-button produtor-button-secondary" :to="rotaRetornoPerfil()">Voltar</RouterLink>
    </div>

    <div v-if="carregando" class="produtor-data-card">Carregando seus dados...</div>
    <section v-else-if="perfil" class="produtor-data-card">
      <div class="produtor-profile-heading">
        <div>
          <h2>{{ perfil.nome }}</h2>
          <p>{{ perfil.email }}</p>
        </div>
        <span class="produtor-status-pill" :class="`produtor-status-${perfil.status.toLowerCase()}`">
          {{ perfil.status === 'APROVADO' ? 'Aprovado' : perfil.status === 'AGUARDANDO_APROVACAO' ? 'Aguardando aprovação' : perfil.status === 'REPROVADO' ? 'Reprovado' : 'Suspenso' }}
        </span>
      </div>

      <div v-if="sucesso" class="produtor-alert produtor-alert-success" role="status">{{ sucesso }}</div>
      <div v-if="erro" class="produtor-alert produtor-alert-error" role="alert">{{ erro }}</div>

      <form class="produtor-form" @submit.prevent="salvar">
        <div class="produtor-form-grid">
          <label class="produtor-field">
            <span>Nome completo ou razão social</span>
            <input v-model="formulario.nome" :disabled="!modoEdicao || perfil.status !== 'APROVADO'" required maxlength="120" />
          </label>
          <label class="produtor-field">
            <span>E-mail</span>
            <input v-model="formulario.email" type="email" :disabled="!modoEdicao || perfil.status !== 'APROVADO'" required maxlength="160" />
          </label>
          <label class="produtor-field">
            <span>CPF ou CNPJ</span>
            <input v-model="formulario.cpfCnpj" :disabled="!modoEdicao || perfil.status !== 'APROVADO'" required maxlength="18" />
          </label>
          <label class="produtor-field">
            <span>Telefone</span>
            <input v-model="formulario.telefone" type="tel" :disabled="!modoEdicao || perfil.status !== 'APROVADO'" required maxlength="20" />
          </label>
          <label class="produtor-field produtor-field-full">
            <span>Descrição</span>
            <textarea v-model="formulario.descricao" rows="4" :disabled="!modoEdicao || perfil.status !== 'APROVADO'" maxlength="600"></textarea>
          </label>
        </div>

        <p v-if="perfil.status !== 'APROVADO'" class="produtor-form-note">A edição cadastral está disponível somente para produtores aprovados. Você ainda pode excluir sua conta.</p>
        <div class="produtor-form-actions">
          <template v-if="perfil.status === 'APROVADO' && !modoEdicao">
            <button class="produtor-button produtor-button-primary" type="button" @click="modoEdicao = true">Editar dados</button>
          </template>
          <template v-else-if="modoEdicao">
            <button class="produtor-button produtor-button-primary" type="submit" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Salvar alterações' }}</button>
            <button class="produtor-button produtor-button-secondary" type="button" :disabled="salvando" @click="cancelarEdicao">Cancelar</button>
          </template>
          <button class="produtor-button produtor-button-danger" type="button" :disabled="excluindo" @click="excluirConta">{{ excluindo ? 'Excluindo conta...' : 'Excluir minha conta' }}</button>
        </div>
      </form>
    </section>
  </main>
</template>
