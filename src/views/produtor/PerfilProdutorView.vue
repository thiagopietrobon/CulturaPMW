<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService, type PerfilProdutorAutenticado } from '../../services/AuthService'
import { useAuth } from '../../composables/useAuth'
import logoCulturaPMW from '../../assets/sgv/culturapmw-logo.png'
import '../../assets/styles/produtor.css'
import '../../assets/styles/produtor-area.css'
import '../../assets/styles/produtor-perfil.css'

type Campo = 'nome' | 'email' | 'cpfCnpj' | 'telefone'

const router = useRouter()
const { atualizarPerfil } = useAuth()
const perfil = ref<PerfilProdutorAutenticado | null>(null)
const formulario = reactive({ nome: '', email: '', cpfCnpj: '', telefone: '', descricao: '' })
const carregando = ref(true)
const salvando = ref(false)
const excluindo = ref(false)
const modoEdicao = ref(false)
const enviado = ref(false)
const erro = ref('')
const sucesso = ref('')

const tocados = reactive<Record<Campo, boolean>>({
  nome: false,
  email: false,
  cpfCnpj: false,
  telefone: false
})

const nomesCampos: Record<Campo, string> = {
  nome: 'Nome ou razão social',
  email: 'E-mail',
  cpfCnpj: 'CPF ou CNPJ',
  telefone: 'Telefone com DDD'
}

const iniciais = computed(() => {
  const nome = perfil.value?.nome?.trim()
  if (!nome) return 'PR'
  const partes = nome.split(/\s+/).filter(Boolean)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
})

const statusInfo = computed(() => {
  const status = perfil.value?.status
  if (status === 'APROVADO') return { label: 'Aprovado', classe: 'is-approved' }
  if (status === 'REPROVADO') return { label: 'Reprovado', classe: 'is-danger' }
  if (status === 'SUSPENSO') return { label: 'Suspenso', classe: 'is-warning' }
  return { label: 'Aguardando aprovação', classe: 'is-pending' }
})

const podeEditar = computed(() => modoEdicao.value && perfil.value?.status === 'APROVADO')

function somenteNumeros(valor: string): string {
  return valor.replace(/\D/g, '')
}

function formatarDocumento(valor: string): string {
  const digitos = somenteNumeros(valor).slice(0, 14)

  if (digitos.length <= 11) {
    if (digitos.length <= 3) return digitos
    if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`
    if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
  }

  if (digitos.length <= 2) return digitos
  if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`
  if (digitos.length <= 8) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`
  if (digitos.length <= 12) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`
}

function formatarTelefone(valor: string): string {
  const digitos = somenteNumeros(valor).slice(0, 11)
  if (digitos.length === 0) return ''
  if (digitos.length <= 2) return `(${digitos}`

  const ddd = digitos.slice(0, 2)
  const numero = digitos.slice(2)
  if (numero.length <= 4) return `(${ddd}) ${numero}`
  if (digitos.length <= 10) return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`
  return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`
}

function posicaoAposDigitos(valor: string, quantidade: number): number {
  if (quantidade <= 0) return 0
  let encontrados = 0
  for (let i = 0; i < valor.length; i += 1) {
    if (/\d/.test(valor[i])) encontrados += 1
    if (encontrados >= quantidade) return i + 1
  }
  return valor.length
}

function atualizarCampoComMascara(
  event: Event,
  atualizar: (valor: string) => void,
  formatar: (valor: string) => string
): void {
  const input = event.target as HTMLInputElement
  const posicaoOriginal = input.selectionStart ?? input.value.length
  const digitosAntesDoCursor = somenteNumeros(input.value.slice(0, posicaoOriginal)).length
  const valorFormatado = formatar(input.value)

  atualizar(valorFormatado)
  input.value = valorFormatado

  const novaPosicao = posicaoAposDigitos(valorFormatado, digitosAntesDoCursor)
  void nextTick(() => input.setSelectionRange(novaPosicao, novaPosicao))
}

function aoDigitarDocumento(event: Event): void {
  atualizarCampoComMascara(event, (valor) => { formulario.cpfCnpj = valor }, formatarDocumento)
}

function aoDigitarTelefone(event: Event): void {
  atualizarCampoComMascara(event, (valor) => { formulario.telefone = valor }, formatarTelefone)
}

function digitoVerificadorCpf(digitos: string): boolean {
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false
  const numeros = digitos.split('').map(Number)

  let soma = 0
  for (let i = 0; i < 9; i += 1) soma += numeros[i] * (10 - i)
  const resto1 = soma % 11
  const primeiro = resto1 < 2 ? 0 : 11 - resto1
  if (numeros[9] !== primeiro) return false

  soma = 0
  for (let i = 0; i < 10; i += 1) soma += numeros[i] * (11 - i)
  const resto2 = soma % 11
  const segundo = resto2 < 2 ? 0 : 11 - resto2
  return numeros[10] === segundo
}

function digitoVerificadorCnpj(digitos: string): boolean {
  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) return false
  const numeros = digitos.split('').map(Number)
  const pesosPrimeiro = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesosSegundo = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  const somaPrimeiro = pesosPrimeiro.reduce((soma, peso, i) => soma + numeros[i] * peso, 0)
  const restoPrimeiro = somaPrimeiro % 11
  const primeiro = restoPrimeiro < 2 ? 0 : 11 - restoPrimeiro
  if (numeros[12] !== primeiro) return false

  const somaSegundo = pesosSegundo.reduce((soma, peso, i) => soma + numeros[i] * peso, 0)
  const restoSegundo = somaSegundo % 11
  const segundo = restoSegundo < 2 ? 0 : 11 - restoSegundo
  return numeros[13] === segundo
}

const erros = computed<Partial<Record<Campo, string>>>(() => {
  const resultado: Partial<Record<Campo, string>> = {}
  const documento = somenteNumeros(formulario.cpfCnpj)
  const numeroTelefone = somenteNumeros(formulario.telefone)
  const emailNormalizado = formulario.email.trim()

  if (!formulario.nome.trim()) resultado.nome = 'Informe seu nome completo ou a razão social.'
  else if (formulario.nome.trim().length < 3) resultado.nome = 'Informe pelo menos 3 caracteres.'

  if (!emailNormalizado) resultado.email = 'Informe seu e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailNormalizado)) resultado.email = 'Digite um endereço de e-mail válido.'

  if (!documento) resultado.cpfCnpj = 'Informe seu CPF ou CNPJ.'
  else if (documento.length === 11 && !digitoVerificadorCpf(documento)) resultado.cpfCnpj = 'CPF inválido. Confira os números digitados.'
  else if (documento.length === 14 && !digitoVerificadorCnpj(documento)) resultado.cpfCnpj = 'CNPJ inválido. Confira os números digitados.'
  else if (documento.length !== 11 && documento.length !== 14) resultado.cpfCnpj = 'Informe 11 dígitos para CPF ou 14 para CNPJ.'

  if (!numeroTelefone) resultado.telefone = 'Informe um telefone com DDD.'
  else if (numeroTelefone.length !== 10 && numeroTelefone.length !== 11) resultado.telefone = 'Use DDD + telefone: 10 ou 11 dígitos.'
  else if (/^(\d)\1+$/.test(numeroTelefone) || numeroTelefone.slice(0, 2) === '00') resultado.telefone = 'Confira o DDD e o número informado.'

  return resultado
})

const listaErros = computed(() => (Object.keys(nomesCampos) as Campo[])
  .filter((campo) => Boolean(erros.value[campo]))
  .map((campo) => ({ campo, nome: nomesCampos[campo], mensagem: erros.value[campo] as string })))

function erroDo(campo: Campo): string {
  if (!podeEditar.value) return ''
  return (enviado.value || tocados[campo]) ? (erros.value[campo] ?? '') : ''
}

function marcarTocado(campo: Campo): void {
  if (podeEditar.value) tocados[campo] = true
}

function resetarValidacao(): void {
  enviado.value = false
  ;(Object.keys(tocados) as Campo[]).forEach((campo) => { tocados[campo] = false })
}

function focarCampo(campo: Campo): void {
  document.getElementById(`perfil-${campo}`)?.focus()
}

function normalizarEmail(): void {
  formulario.email = formulario.email.trim().toLowerCase()
}

function normalizarNome(): void {
  formulario.nome = formulario.nome.trim().replace(/\s+/g, ' ')
}

function rotaRetornoPerfil(): string {
  if (perfil.value?.status === 'APROVADO') return '/produtor/painel'
  if (perfil.value?.status === 'REPROVADO') return '/produtor/reprovado'
  if (perfil.value?.status === 'SUSPENSO') return '/produtor/suspenso'
  return '/produtor/aguardando-aprovacao'
}

function preencher(dados: PerfilProdutorAutenticado) {
  formulario.nome = dados.nome
  formulario.email = dados.email
  formulario.cpfCnpj = formatarDocumento(dados.cpf_cnpj)
  formulario.telefone = formatarTelefone(dados.telefone)
  formulario.descricao = dados.descricao ?? ''
}

async function iniciarEdicao() {
  sucesso.value = ''
  erro.value = ''
  resetarValidacao()
  modoEdicao.value = true
  await nextTick()
  focarCampo('nome')
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    perfil.value = await authService.produtorAtual()
    if (!perfil.value) throw new Error('Não foi possível localizar seu cadastro.')
    preencher(perfil.value)
    resetarValidacao()
  } catch (error) {
    erro.value = error instanceof Error ? error.message : 'Não foi possível carregar seus dados.'
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  erro.value = ''
  sucesso.value = ''
  enviado.value = true
  ;(Object.keys(tocados) as Campo[]).forEach((campo) => { tocados[campo] = true })

  if (listaErros.value.length > 0) {
    await nextTick()
    focarCampo(listaErros.value[0].campo)
    return
  }

  salvando.value = true
  try {
    const resultado = await authService.atualizarPerfilProdutor({
      nome: formulario.nome.trim().replace(/\s+/g, ' '),
      email: formulario.email.trim().toLowerCase(),
      cpfCnpj: somenteNumeros(formulario.cpfCnpj),
      telefone: somenteNumeros(formulario.telefone),
      descricao: formulario.descricao.trim()
    })
    await carregar()
    modoEdicao.value = false
    sucesso.value = resultado.emailPendente
      ? 'Dados atualizados. A alteração do e-mail foi solicitada; confirme a mensagem enviada, caso o Supabase exija essa etapa.'
      : 'Seus dados foram atualizados com sucesso.'
    await atualizarPerfil()
  } catch (error) {
    console.error('[CulturaPMW] Falha ao atualizar perfil do produtor:', error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível atualizar seus dados. Tente novamente.'
  } finally {
    salvando.value = false
  }
}

function cancelarEdicao() {
  if (perfil.value) preencher(perfil.value)
  modoEdicao.value = false
  resetarValidacao()
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
    console.error('[CulturaPMW] Falha ao excluir conta do produtor:', error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível excluir a conta. Seus dados foram mantidos.'
  } finally {
    excluindo.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <main class="produtor-area-page">
    <section class="produtor-profile-card" aria-labelledby="perfil-title">
      <!-- Barra superior: marca + botão voltar -->
      <div class="produtor-profile-topbar">
        <RouterLink
          to="/"
          class="produtor-profile-brand"
          aria-label="CulturaPMW — voltar para a página inicial"
        >
          <img
            :src="logoCulturaPMW"
            alt="CulturaPMW — Eventos que conectam Palmas"
            width="560"
            height="163"
          />
        </RouterLink>

        <RouterLink class="produtor-btn-secondary produtor-profile-back" :to="rotaRetornoPerfil()">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5" />
            <path d="m11 18-6-6 6-6" />
          </svg>
          <span>Voltar</span>
        </RouterLink>
      </div>

      <div class="produtor-divider" aria-hidden="true"></div>

      <!-- Estado: carregando -->
      <div v-if="carregando" class="produtor-profile-state" role="status">
        <svg class="is-spinning" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        </svg>
        <p>Carregando seus dados cadastrais...</p>
      </div>

      <!-- Estado: perfil carregado -->
      <template v-else-if="perfil">
        <header class="produtor-profile-header">
          <div class="produtor-profile-identity">
            <div class="produtor-profile-avatar" aria-hidden="true">{{ iniciais }}</div>
            <div class="produtor-profile-title-group">
              <p class="produtor-profile-eyebrow">Área do produtor • Perfil</p>
              <h1 id="perfil-title">Meus dados cadastrais</h1>
              <p class="produtor-profile-subtitle">{{ perfil.email }}</p>
            </div>
          </div>

          <span class="produtor-status-badge" :class="statusInfo.classe">
            <svg v-if="perfil.status === 'APROVADO'" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="m8.5 12.2 2.3 2.3 4.8-4.8" />
            </svg>
            <svg v-else-if="perfil.status === 'AGUARDANDO_APROVACAO'" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5l3.2 1.8" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4.5" />
              <circle cx="12" cy="16" r=".75" class="produtor-icon-fill-current" />
            </svg>
            <span>{{ statusInfo.label }}</span>
          </span>
        </header>

        <p v-if="sucesso" class="produtor-status-alert is-success" role="status" aria-live="polite">
          {{ sucesso }}
        </p>

        <form class="produtor-profile-form" novalidate @submit.prevent="salvar">
          <div
            v-if="podeEditar && enviado && listaErros.length"
            class="produtor-error-summary"
            role="alert"
            aria-live="assertive"
          >
            <strong>
              Encontramos {{ listaErros.length }}
              {{ listaErros.length === 1 ? 'campo que precisa' : 'campos que precisam' }} de atenção:
            </strong>
            <ul>
              <li v-for="item in listaErros" :key="item.campo">
                <button type="button" @click="focarCampo(item.campo)">
                  {{ item.nome }}: {{ item.mensagem }}
                </button>
              </li>
            </ul>
          </div>

          <p v-if="erro" class="produtor-status-alert is-error" role="alert">
            {{ erro }}
          </p>

          <div class="produtor-profile-grid">
            <label class="produtor-profile-field" :class="{ 'is-invalid': erroDo('nome') }">
              <span class="produtor-label">
                Nome completo ou razão social <b v-if="podeEditar">*</b>
              </span>
              <span class="produtor-input-wrap" :class="{ 'is-readonly': !podeEditar }">
                <svg class="produtor-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.8" />
                  <path d="M5 19.5c1.5-3.4 4.2-5 7-5s5.5 1.6 7 5" />
                </svg>
                <input
                  id="perfil-nome"
                  v-model="formulario.nome"
                  type="text"
                  autocomplete="name"
                  :disabled="!podeEditar"
                  required
                  maxlength="120"
                  placeholder="Como deseja ser identificado"
                  :aria-invalid="Boolean(erroDo('nome'))"
                  :aria-describedby="erroDo('nome') ? 'erro-perfil-nome' : undefined"
                  @blur="normalizarNome(); marcarTocado('nome')"
                />
              </span>
              <small v-if="erroDo('nome')" id="erro-perfil-nome" class="produtor-field-error">
                {{ erroDo('nome') }}
              </small>
            </label>

            <label class="produtor-profile-field" :class="{ 'is-invalid': erroDo('email') }">
              <span class="produtor-label">
                E-mail <b v-if="podeEditar">*</b>
              </span>
              <span class="produtor-input-wrap" :class="{ 'is-readonly': !podeEditar }">
                <svg class="produtor-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3.25" y="5" width="17.5" height="14" rx="2.5" />
                  <path d="m4.5 7 7.5 6 7.5-6" />
                </svg>
                <input
                  id="perfil-email"
                  v-model="formulario.email"
                  type="email"
                  autocomplete="email"
                  :disabled="!podeEditar"
                  required
                  maxlength="160"
                  placeholder="voce@exemplo.com"
                  :aria-invalid="Boolean(erroDo('email'))"
                  :aria-describedby="erroDo('email') ? 'erro-perfil-email' : undefined"
                  @blur="normalizarEmail(); marcarTocado('email')"
                />
              </span>
              <small v-if="erroDo('email')" id="erro-perfil-email" class="produtor-field-error">
                {{ erroDo('email') }}
              </small>
            </label>

            <label class="produtor-profile-field" :class="{ 'is-invalid': erroDo('cpfCnpj') }">
              <span class="produtor-label">
                CPF ou CNPJ <b v-if="podeEditar">*</b>
              </span>
              <span class="produtor-input-wrap" :class="{ 'is-readonly': !podeEditar }">
                <svg class="produtor-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
                  <path d="M7.5 10h4M7.5 14h9" />
                </svg>
                <input
                  id="perfil-cpfCnpj"
                  :value="formulario.cpfCnpj"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  :disabled="!podeEditar"
                  required
                  maxlength="18"
                  placeholder="000.000.000-00 ou CNPJ"
                  :aria-invalid="Boolean(erroDo('cpfCnpj'))"
                  :aria-describedby="erroDo('cpfCnpj') ? 'erro-perfil-cpfCnpj' : (podeEditar ? 'ajuda-perfil-cpfCnpj' : undefined)"
                  @input="aoDigitarDocumento"
                  @blur="marcarTocado('cpfCnpj')"
                />
              </span>
              <small v-if="erroDo('cpfCnpj')" id="erro-perfil-cpfCnpj" class="produtor-field-error">
                {{ erroDo('cpfCnpj') }}
              </small>
              <small v-else-if="podeEditar" id="ajuda-perfil-cpfCnpj" class="produtor-field-hint">
                A pontuação é aplicada automaticamente.
              </small>
            </label>

            <label class="produtor-profile-field" :class="{ 'is-invalid': erroDo('telefone') }">
              <span class="produtor-label">
                Telefone com DDD <b v-if="podeEditar">*</b>
              </span>
              <span class="produtor-input-wrap" :class="{ 'is-readonly': !podeEditar }">
                <svg class="produtor-input-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.5 4.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.5 6.7 2 2 0 0 1 6.5 4.5Z" />
                </svg>
                <input
                  id="perfil-telefone"
                  :value="formulario.telefone"
                  type="tel"
                  inputmode="numeric"
                  autocomplete="tel"
                  :disabled="!podeEditar"
                  required
                  maxlength="16"
                  placeholder="(63) 99999-9999"
                  :aria-invalid="Boolean(erroDo('telefone'))"
                  :aria-describedby="erroDo('telefone') ? 'erro-perfil-telefone' : (podeEditar ? 'ajuda-perfil-telefone' : undefined)"
                  @input="aoDigitarTelefone"
                  @blur="marcarTocado('telefone')"
                />
              </span>
              <small v-if="erroDo('telefone')" id="erro-perfil-telefone" class="produtor-field-error">
                {{ erroDo('telefone') }}
              </small>
              <small v-else-if="podeEditar" id="ajuda-perfil-telefone" class="produtor-field-hint">
                Inclua o DDD. A pontuação é automática.
              </small>
            </label>

            <label class="produtor-profile-field is-full">
              <span class="produtor-field-label-row">
                <span class="produtor-label">
                  Descrição do produtor <em v-if="podeEditar">Opcional</em>
                </span>
                <small v-if="podeEditar" class="produtor-char-count" aria-live="polite">
                  {{ formulario.descricao.length }}/600 caracteres
                </small>
              </span>
              <span class="produtor-textarea-wrap" :class="{ 'is-readonly': !podeEditar }">
                <textarea
                  id="perfil-descricao"
                  v-model="formulario.descricao"
                  rows="3"
                  :disabled="!podeEditar"
                  maxlength="600"
                  placeholder="Conte um pouco sobre sua atuação cultural ou produtora"
                ></textarea>
              </span>
            </label>
          </div>

          <div v-if="perfil.status !== 'APROVADO'" class="produtor-status-note">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5" />
              <circle cx="12" cy="8" r=".75" class="produtor-icon-fill" />
            </svg>
            <p>
              A edição cadastral está disponível somente para produtores aprovados. Você ainda pode excluir sua conta.
            </p>
          </div>

          <div class="produtor-profile-actions">
            <div class="produtor-profile-actions-main">
              <button
                v-if="perfil.status === 'APROVADO' && !modoEdicao"
                class="produtor-btn-primary produtor-profile-btn-main"
                type="button"
                @click="iniciarEdicao"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                <span>Editar dados</span>
              </button>

              <template v-else-if="modoEdicao">
                <button
                  class="produtor-btn-primary produtor-profile-btn-main"
                  type="submit"
                  :disabled="salvando"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                  <span>{{ salvando ? 'Salvando...' : 'Salvar alterações' }}</span>
                </button>

                <button
                  class="produtor-btn-secondary"
                  type="button"
                  :disabled="salvando"
                  @click="cancelarEdicao"
                >
                  Cancelar
                </button>
              </template>
            </div>

            <button
              class="produtor-btn-danger"
              type="button"
              :disabled="excluindo || salvando"
              @click="excluirConta"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              <span>{{ excluindo ? 'Excluindo conta...' : 'Excluir minha conta' }}</span>
            </button>
          </div>
        </form>
      </template>

      <!-- Estado: falha ao carregar perfil -->
      <div v-else class="produtor-profile-state">
        <p class="produtor-status-alert is-error" role="alert">
          {{ erro || 'Não foi possível carregar seus dados cadastrais.' }}
        </p>
        <button class="produtor-btn-primary produtor-profile-btn-main" type="button" @click="carregar">
          Tentar novamente
        </button>
      </div>
    </section>
  </main>
</template>