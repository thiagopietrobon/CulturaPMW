<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../../services/AuthService'
import logoCulturaPMW from '../../assets/svg/culturapmw-logo.png'
import '../../assets/styles/produtor.css'
import '../../assets/styles/cadastro-produtor.css'

type Campo = 'nome' | 'email' | 'cpfCnpj' | 'telefone' | 'senha' | 'confirmarSenha'

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
const enviado = ref(false)
const senhaVisivel = ref(false)
const confirmacaoVisivel = ref(false)

const tocados = reactive<Record<Campo, boolean>>({
  nome: false,
  email: false,
  cpfCnpj: false,
  telefone: false,
  senha: false,
  confirmarSenha: false
})

const nomesCampos: Record<Campo, string> = {
  nome: 'Nome ou razão social',
  email: 'E-mail',
  cpfCnpj: 'CPF ou CNPJ',
  telefone: 'Telefone',
  senha: 'Senha',
  confirmarSenha: 'Confirmação de senha'
}

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
  atualizarCampoComMascara(event, (valor) => { cpfCnpj.value = valor }, formatarDocumento)
}

function aoDigitarTelefone(event: Event): void {
  atualizarCampoComMascara(event, (valor) => { telefone.value = valor }, formatarTelefone)
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
  const documento = somenteNumeros(cpfCnpj.value)
  const numeroTelefone = somenteNumeros(telefone.value)
  const emailNormalizado = email.value.trim()

  if (!nome.value.trim()) resultado.nome = 'Informe seu nome completo ou a razão social.'
  else if (nome.value.trim().length < 3) resultado.nome = 'Informe pelo menos 3 caracteres.'

  if (!emailNormalizado) resultado.email = 'Informe seu e-mail.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailNormalizado)) resultado.email = 'Digite um endereço de e-mail válido.'

  if (!documento) resultado.cpfCnpj = 'Informe seu CPF ou CNPJ.'
  else if (documento.length === 11 && !digitoVerificadorCpf(documento)) resultado.cpfCnpj = 'CPF inválido. Confira os números digitados.'
  else if (documento.length === 14 && !digitoVerificadorCnpj(documento)) resultado.cpfCnpj = 'CNPJ inválido. Confira os números digitados.'
  else if (documento.length !== 11 && documento.length !== 14) resultado.cpfCnpj = 'Informe 11 dígitos para CPF ou 14 para CNPJ.'

  if (!numeroTelefone) resultado.telefone = 'Informe um telefone com DDD.'
  else if (numeroTelefone.length !== 10 && numeroTelefone.length !== 11) resultado.telefone = 'Use DDD + telefone: 10 ou 11 dígitos.'
  else if (/^(\d)\1+$/.test(numeroTelefone) || numeroTelefone.slice(0, 2) === '00') resultado.telefone = 'Confira o DDD e o número informado.'

  if (!senha.value) resultado.senha = 'Crie uma senha.'
  else if (senha.value.length < 8) resultado.senha = 'A senha precisa ter pelo menos 8 caracteres.'

  if (!confirmarSenha.value) resultado.confirmarSenha = 'Confirme sua senha.'
  else if (confirmarSenha.value !== senha.value) resultado.confirmarSenha = 'As senhas não são iguais.'

  return resultado
})

const listaErros = computed(() => (Object.keys(nomesCampos) as Campo[])
  .filter((campo) => Boolean(erros.value[campo]))
  .map((campo) => ({ campo, nome: nomesCampos[campo], mensagem: erros.value[campo] as string })))

function erroDo(campo: Campo): string {
  return (enviado.value || tocados[campo]) ? (erros.value[campo] ?? '') : ''
}

function marcarTocado(campo: Campo): void {
  tocados[campo] = true
}

function focarCampo(campo: Campo): void {
  document.getElementById(`cadastro-${campo}`)?.focus()
}

function normalizarEmail(): void {
  email.value = email.value.trim().toLowerCase()
}

function normalizarNome(): void {
  nome.value = nome.value.trim().replace(/\s+/g, ' ')
}

async function cadastrar(): Promise<void> {
  erro.value = ''
  sucesso.value = ''
  enviado.value = true
  ;(Object.keys(tocados) as Campo[]).forEach((campo) => { tocados[campo] = true })

  if (listaErros.value.length > 0) {
    await nextTick()
    focarCampo(listaErros.value[0].campo)
    return
  }

  carregando.value = true
  try {
    const resultado = await authService.cadastrarProdutor({
      nome: nome.value.trim().replace(/\s+/g, ' '),
      email: email.value.trim().toLowerCase(),
      // A máscara é apenas visual. O banco recebe somente dígitos para padronizar os documentos.
      cpfCnpj: somenteNumeros(cpfCnpj.value),
      telefone: somenteNumeros(telefone.value),
      descricao: descricao.value.trim(),
      senha: senha.value
    })

    if (resultado.aguardandoConfirmacaoEmail) {
      sucesso.value = 'Solicitação registrada! Confira seu e-mail e confirme o endereço para concluir o cadastro. Depois, você poderá entrar e acompanhar a análise da administração.'
    } else {
      await router.replace({ name: 'produtor-status' })
    }
  } catch (error) {
    console.error('[CulturaPMW] Erro no cadastro do produtor:', error)
    erro.value = error instanceof Error
      ? error.message
      : 'Não foi possível enviar sua solicitação. Confira os dados e tente novamente.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="cadastro-page">
    <section class="cadastro-card" aria-labelledby="cadastro-titulo">
      <RouterLink to="/" class="cadastro-logo-link" aria-label="Voltar para a página inicial">
        <img :src="logoCulturaPMW" alt="CulturaPMW — Eventos que conectam Palmas" class="cadastro-logo" />
      </RouterLink>

      <div class="cadastro-divider" aria-hidden="true"></div>

      <header class="cadastro-heading">
        <span class="cadastro-eyebrow">CADASTRO DE PRODUTOR</span>
        <h1 id="cadastro-titulo">Solicite seu acesso</h1>
        <p>Preencha seus dados para participar do CulturaPMW. Sua solicitação será analisada pela administração.</p>
      </header>

      <div v-if="sucesso" class="cadastro-success" role="status" aria-live="polite">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5" /></svg>
        <div>
          <strong>Solicitação enviada!</strong>
          <p>{{ sucesso }}</p>
          <RouterLink to="/login">Ir para o login</RouterLink>
        </div>
      </div>

      <form v-else class="cadastro-form" novalidate @submit.prevent="cadastrar">
        <div v-if="enviado && listaErros.length" class="cadastro-error-summary" role="alert" aria-live="assertive">
          <strong>Encontramos {{ listaErros.length }} {{ listaErros.length === 1 ? 'campo que precisa' : 'campos que precisam' }} de atenção:</strong>
          <ul>
            <li v-for="item in listaErros" :key="item.campo">
              <button type="button" @click="focarCampo(item.campo)">{{ item.nome }}: {{ item.mensagem }}</button>
            </li>
          </ul>
        </div>

        <div v-if="erro" class="cadastro-server-error" role="alert">{{ erro }}</div>

        <div class="cadastro-grid">
          <label class="cadastro-field cadastro-field-full" :class="{ 'is-invalid': erroDo('nome') }">
            <span class="cadastro-label">Nome completo ou razão social <b>*</b></span>
            <span class="cadastro-input-wrap">
              <svg class="cadastro-input-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-3.7 3-5.6 7-5.6s6.3 1.9 7 5.6"/></svg>
              <input id="cadastro-nome" v-model="nome" type="text" autocomplete="name" maxlength="120" required placeholder="Como deseja ser identificado" :aria-invalid="Boolean(erroDo('nome'))" :aria-describedby="erroDo('nome') ? 'erro-nome' : undefined" @blur="normalizarNome(); marcarTocado('nome')" />
            </span>
            <small v-if="erroDo('nome')" id="erro-nome" class="cadastro-field-error">{{ erroDo('nome') }}</small>
          </label>

          <label class="cadastro-field" :class="{ 'is-invalid': erroDo('email') }">
            <span class="cadastro-label">E-mail <b>*</b></span>
            <span class="cadastro-input-wrap">
              <svg class="cadastro-input-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>
              <input id="cadastro-email" v-model="email" type="email" autocomplete="email" maxlength="160" required placeholder="voce@exemplo.com" :aria-invalid="Boolean(erroDo('email'))" :aria-describedby="erroDo('email') ? 'erro-email' : undefined" @blur="normalizarEmail(); marcarTocado('email')" />
            </span>
            <small v-if="erroDo('email')" id="erro-email" class="cadastro-field-error">{{ erroDo('email') }}</small>
          </label>

          <label class="cadastro-field" :class="{ 'is-invalid': erroDo('cpfCnpj') }">
            <span class="cadastro-label">CPF ou CNPJ <b>*</b></span>
            <span class="cadastro-input-wrap">
              <svg class="cadastro-input-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h4M7 13h7M7 16h3M17 9v7"/></svg>
              <input id="cadastro-cpfCnpj" :value="cpfCnpj" type="text" inputmode="numeric" autocomplete="off" maxlength="18" required placeholder="000.000.000-00 ou CNPJ" :aria-invalid="Boolean(erroDo('cpfCnpj'))" :aria-describedby="erroDo('cpfCnpj') ? 'erro-cpfCnpj' : 'ajuda-cpfCnpj'" @input="aoDigitarDocumento" @blur="marcarTocado('cpfCnpj')" />
            </span>
            <small v-if="erroDo('cpfCnpj')" id="erro-cpfCnpj" class="cadastro-field-error">{{ erroDo('cpfCnpj') }}</small>
            <small v-else id="ajuda-cpfCnpj" class="cadastro-field-hint">A pontuação é aplicada automaticamente.</small>
          </label>

          <label class="cadastro-field" :class="{ 'is-invalid': erroDo('telefone') }">
            <span class="cadastro-label">Telefone com DDD <b>*</b></span>
            <span class="cadastro-input-wrap">
              <svg class="cadastro-input-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h3l1.5 4-2 1.5a15 15 0 0 0 6 6l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C10.7 19 5 13.3 5 6c0-1.7.9-3 2-3Z"/></svg>
              <input id="cadastro-telefone" :value="telefone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="16" required placeholder="(63) 99999-9999" :aria-invalid="Boolean(erroDo('telefone'))" :aria-describedby="erroDo('telefone') ? 'erro-telefone' : 'ajuda-telefone'" @input="aoDigitarTelefone" @blur="marcarTocado('telefone')" />
            </span>
            <small v-if="erroDo('telefone')" id="erro-telefone" class="cadastro-field-error">{{ erroDo('telefone') }}</small>
            <small v-else id="ajuda-telefone" class="cadastro-field-hint">Inclua o DDD. A pontuação é automática.</small>
          </label>

          <label class="cadastro-field cadastro-field-full">
            <span class="cadastro-description-header">
              <span class="cadastro-label">Descrição do produtor <em>Opcional</em></span>
              <small class="cadastro-character-count" aria-live="polite">{{ descricao.length }}/600 caracteres</small>
            </span>
            <span class="cadastro-textarea-wrap">
              <svg class="cadastro-input-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M7 9h10M7 13h10M7 17h6"/></svg>
              <textarea id="cadastro-descricao" v-model="descricao" rows="2" maxlength="600" placeholder="Conte um pouco sobre você ou sua organização"></textarea>
            </span>
          </label>

          <label class="cadastro-field" :class="{ 'is-invalid': erroDo('senha') }">
            <span class="cadastro-label">Senha <b>*</b></span>
            <span class="cadastro-input-wrap">
              <svg class="cadastro-input-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>
              <input id="cadastro-senha" v-model="senha" :type="senhaVisivel ? 'text' : 'password'" autocomplete="new-password" minlength="8" required placeholder="Mínimo de 8 caracteres" :aria-invalid="Boolean(erroDo('senha'))" :aria-describedby="erroDo('senha') ? 'erro-senha' : 'ajuda-senha'" @blur="marcarTocado('senha')" />
              <button class="cadastro-password-toggle" type="button" :aria-label="senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'" @click="senhaVisivel = !senhaVisivel">
                <svg v-if="!senhaVisivel" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/></svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A10 10 0 0 1 12 6c6.1 0 9.5 6 9.5 6a15 15 0 0 1-3.1 3.8M6.2 6.3C3.8 7.9 2.5 12 2.5 12s3.4 6 9.5 6c1 0 2-.2 2.8-.5"/></svg>
              </button>
            </span>
            <small v-if="erroDo('senha')" id="erro-senha" class="cadastro-field-error">{{ erroDo('senha') }}</small>
            <small v-else id="ajuda-senha" class="cadastro-field-hint">Use pelo menos 8 caracteres.</small>
          </label>

          <label class="cadastro-field" :class="{ 'is-invalid': erroDo('confirmarSenha') }">
            <span class="cadastro-label">Confirmar senha <b>*</b></span>
            <span class="cadastro-input-wrap">
              <svg class="cadastro-input-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M9 15l2 2 4-4"/></svg>
              <input id="cadastro-confirmarSenha" v-model="confirmarSenha" :type="confirmacaoVisivel ? 'text' : 'password'" autocomplete="new-password" minlength="8" required placeholder="Repita sua senha" :aria-invalid="Boolean(erroDo('confirmarSenha'))" :aria-describedby="erroDo('confirmarSenha') ? 'erro-confirmarSenha' : undefined" @blur="marcarTocado('confirmarSenha')" />
              <button class="cadastro-password-toggle" type="button" :aria-label="confirmacaoVisivel ? 'Ocultar confirmação' : 'Mostrar confirmação'" @click="confirmacaoVisivel = !confirmacaoVisivel">
                <svg v-if="!confirmacaoVisivel" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/></svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A10 10 0 0 1 12 6c6.1 0 9.5 6 9.5 6a15 15 0 0 1-3.1 3.8M6.2 6.3C3.8 7.9 2.5 12 2.5 12s3.4 6 9.5 6c1 0 2-.2 2.8-.5"/></svg>
              </button>
            </span>
            <small v-if="erroDo('confirmarSenha')" id="erro-confirmarSenha" class="cadastro-field-error">{{ erroDo('confirmarSenha') }}</small>
          </label>
        </div>

        <p class="cadastro-form-note"><strong>* Campos obrigatórios.</strong> Após o envio, sua conta ficará aguardando aprovação e não poderá publicar eventos até a liberação pela administração.</p>

        <button class="cadastro-submit" type="submit" :disabled="carregando">
          <svg v-if="!carregando" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>
          <span>{{ carregando ? 'Enviando solicitação...' : 'Enviar solicitação de cadastro' }}</span>
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
