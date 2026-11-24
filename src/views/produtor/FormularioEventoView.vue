<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import LocalizacaoEventoForm from '../../components/formularios/LocalizacaoEventoForm.vue'
import { authService, type PerfilProdutorAutenticado } from '../../services/AuthService'
import type { Categoria } from '../../models/Categoria'
import {
  criarLocalizacaoVazia,
  type DadosLocalizacaoEvento
} from '../../services/LocalizacaoService'
import {
  eventoService,
  type DadosSalvarEventoProdutor
} from '../../services/EventoService'
import type { TipoLink } from '../../models/LinkExterno'
import logoCulturaPMW from '../../assets/svg/culturapmw-logo.png'
import '../../assets/styles/produtor.css'
import '../../assets/styles/produtor-evento-form.css'

type Campo =
  | 'titulo'
  | 'descricao'
  | 'categoria_id'
  | 'data_inicio'
  | 'data_fim'
  | 'valor_ingresso'
  | 'imagem'
  | 'localizacao'
  | 'links'

interface LinkFormulario {
  tipo: TipoLink
  url: string
}

interface FormularioLocalizacaoRef {
  validar: () => string | null
  obterDados: () => DadosLocalizacaoEvento
}

const route = useRoute()
const router = useRouter()
const eventoId = computed(() => (typeof route.params.id === 'string' ? route.params.id : null))
const editando = computed(() => Boolean(eventoId.value))
const localizacaoForm = ref<FormularioLocalizacaoRef | null>(null)
const categorias = ref<Categoria[]>([])
const carregando = ref(true)
const salvando = ref(false)
const enviado = ref(false)
const erro = ref('')
const erroImagem = ref('')
const arquivoImagem = ref<File | null>(null)
const inputImagem = ref<HTMLInputElement | null>(null)
const previaImagem = ref('')
const removerImagemAtual = ref(false)
const imagemOriginal = ref<string | null>(null)
let urlTemporaria: string | null = null

const formulario = reactive({
  titulo: '',
  descricao: '',
  categoria_id: 0,
  data_inicio: '',
  data_fim: '',
  gratuito: true,
  valor_ingresso: 0,
  imagem_url: null as string | null,
  localizacao: criarLocalizacaoVazia(),
  links: [] as LinkFormulario[]
})

const tocados = reactive<Record<Campo, boolean>>({
  titulo: false,
  descricao: false,
  categoria_id: false,
  data_inicio: false,
  data_fim: false,
  valor_ingresso: false,
  imagem: false,
  localizacao: false,
  links: false
})

const tocadosLinks = ref<boolean[]>([])

const nomesCampos: Record<Campo, string> = {
  titulo: 'Título do evento',
  descricao: 'Descrição',
  categoria_id: 'Categoria',
  data_inicio: 'Data e horário de início',
  data_fim: 'Data e horário de término',
  valor_ingresso: 'Valor do ingresso',
  imagem: 'Imagem do evento',
  localizacao: 'Localização',
  links: 'Links externos'
}

const tiposLink: Array<{ valor: TipoLink; rotulo: string }> = [
  { valor: 'INGRESSO', rotulo: 'Ingressos' },
  { valor: 'DIVULGACAO', rotulo: 'Divulgação / página oficial' },
  { valor: 'CONTATO', rotulo: 'Contato do organizador' },
  { valor: 'OUTRO', rotulo: 'Outras informações' }
]

function paraDataHoraLocal(valor: string): string {
  const data = new Date(valor)
  return new Date(data.getTime() - data.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function validarUrl(url: string): boolean {
  try {
    const valor = new URL(url)
    return valor.protocol === 'http:' || valor.protocol === 'https:'
  } catch {
    return false
  }
}

const errosLinks = computed<Record<number, string>>(() => {
  const mapa: Record<number, string> = {}
  formulario.links.forEach((link, indice) => {
    const url = link.url.trim()
    if (url && !validarUrl(url)) {
      mapa[indice] = 'Informe uma URL válida iniciada por http:// ou https://.'
    }
  })
  return mapa
})

const erros = computed<Partial<Record<Campo, string>>>(() => {
  const resultado: Partial<Record<Campo, string>> = {}
  const tituloLimpo = formulario.titulo.trim()
  const descricaoLimpa = formulario.descricao.trim()

  if (!tituloLimpo) {
    resultado.titulo = 'Informe o título do evento.'
  } else if (tituloLimpo.length < 3) {
    resultado.titulo = 'Informe pelo menos 3 caracteres para o título.'
  }

  if (!descricaoLimpa) {
    resultado.descricao = 'Informe a descrição do evento.'
  } else if (descricaoLimpa.length < 10) {
    resultado.descricao = 'Informe pelo menos 10 caracteres na descrição.'
  }

  if (!formulario.categoria_id) {
    resultado.categoria_id = 'Selecione uma categoria para o evento.'
  }

  if (!formulario.data_inicio) {
    resultado.data_inicio = 'Informe a data e o horário de início.'
  }

  if (!formulario.data_fim) {
    resultado.data_fim = 'Informe a data e o horário de término.'
  } else if (
    formulario.data_inicio &&
    new Date(formulario.data_fim) <= new Date(formulario.data_inicio)
  ) {
    resultado.data_fim = 'A data e o horário de término devem ser posteriores ao início.'
  }

  if (!formulario.gratuito) {
    const valor = Number(formulario.valor_ingresso)
    if (!Number.isFinite(valor) || valor <= 0) {
      resultado.valor_ingresso = 'Informe um valor de ingresso maior que zero.'
    }
  }

  if (erroImagem.value) {
    resultado.imagem = erroImagem.value
  }

  void formulario.localizacao.cep
  void formulario.localizacao.logradouro
  void formulario.localizacao.numero
  void formulario.localizacao.complemento
  void formulario.localizacao.bairro
  void formulario.localizacao.cidade
  void formulario.localizacao.uf
  void formulario.localizacao.regiao_id

  const erroLocalizacao = localizacaoForm.value?.validar()
  if (erroLocalizacao) {
    resultado.localizacao = erroLocalizacao
  }

  const indicesInvalidos = Object.keys(errosLinks.value)
  if (indicesInvalidos.length > 0) {
    resultado.links =
      indicesInvalidos.length === 1
        ? 'Confira o link externo informado (use http:// ou https://).'
        : `Confira os ${indicesInvalidos.length} links externos inválidos (use http:// ou https://).`
  }

  return resultado
})

const listaErros = computed(() =>
  (Object.keys(nomesCampos) as Campo[])
    .filter((campo) => Boolean(erros.value[campo]))
    .map((campo) => ({
      campo,
      nome: nomesCampos[campo],
      mensagem: erros.value[campo] as string
    }))
)

function erroDo(campo: Campo): string {
  return enviado.value || tocados[campo] ? (erros.value[campo] ?? '') : ''
}

function erroDoLink(indice: number): string {
  return enviado.value || tocadosLinks.value[indice] ? (errosLinks.value[indice] ?? '') : ''
}

function marcarTocado(campo: Campo): void {
  tocados[campo] = true
}

function marcarLinkTocado(indice: number): void {
  tocadosLinks.value[indice] = true
  tocados.links = true
}

function normalizarTitulo(): void {
  formulario.titulo = formulario.titulo.trim().replace(/\s+/g, ' ')
}

function aoAlterarGratuito(): void {
  if (formulario.gratuito) {
    tocados.valor_ingresso = false
  }
}

function focarCampo(campo: Campo): void {
  if (campo === 'localizacao') {
    const container = document.getElementById('evento-localizacao')
    const alvo = container?.querySelector<HTMLElement>(
      '[aria-invalid="true"], input:not([disabled]), select:not([disabled])'
    )
    alvo?.focus()
    return
  }

  if (campo === 'links') {
    const primeiroIndice = Object.keys(errosLinks.value)[0]
    if (primeiroIndice !== undefined) {
      document.getElementById(`evento-link-url-${primeiroIndice}`)?.focus()
    }
    return
  }

  document.getElementById(`evento-${campo}`)?.focus()
}

function limparPreviaTemporaria() {
  if (urlTemporaria) URL.revokeObjectURL(urlTemporaria)
  urlTemporaria = null
}

function selecionarImagem(event: Event) {
  const input = event.target as HTMLInputElement
  const arquivo = input.files?.[0] ?? null
  erro.value = ''
  erroImagem.value = ''
  tocados.imagem = true
  if (!arquivo) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) {
    erroImagem.value = 'Selecione uma imagem JPG, PNG ou WebP.'
    input.value = ''
    return
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    erroImagem.value = 'A imagem deve possuir no máximo 5 MB.'
    input.value = ''
    return
  }

  limparPreviaTemporaria()
  arquivoImagem.value = arquivo
  removerImagemAtual.value = false
  urlTemporaria = URL.createObjectURL(arquivo)
  previaImagem.value = urlTemporaria
}

function removerImagem() {
  limparPreviaTemporaria()
  erroImagem.value = ''
  arquivoImagem.value = null
  previaImagem.value = ''
  removerImagemAtual.value = true
  if (inputImagem.value) inputImagem.value.value = ''
}

function adicionarLink() {
  formulario.links.push({ tipo: 'OUTRO', url: '' })
  tocadosLinks.value.push(false)
}

function removerLink(indice: number) {
  formulario.links.splice(indice, 1)
  tocadosLinks.value.splice(indice, 1)
}

async function carregarFormulario() {
  carregando.value = true
  erro.value = ''
  try {
    const listaCategorias = await eventoService.listarCategorias()
    categorias.value = listaCategorias

    if (editando.value && eventoId.value) {
      const produtor = await authService.produtorAtual()
      if (!produtor) throw new Error('Sua sessão de produtor não está disponível. Entre novamente.')
      const evento = await eventoService.buscarMeuEvento(eventoId.value, produtor.id)
      if (!evento) {
        erro.value = 'Evento não encontrado ou você não possui permissão para editá-lo.'
        return
      }

      formulario.titulo = evento.titulo
      formulario.descricao = evento.descricao
      formulario.categoria_id = evento.categoria_id
      formulario.data_inicio = paraDataHoraLocal(evento.data_inicio)
      formulario.data_fim = paraDataHoraLocal(evento.data_fim)
      formulario.gratuito = evento.gratuito
      formulario.valor_ingresso = Number(evento.valor_ingresso ?? 0)
      formulario.imagem_url = evento.imagem_url
      imagemOriginal.value = evento.imagem_url
      previaImagem.value = evento.imagem_url ?? ''
      formulario.localizacao = {
        ...criarLocalizacaoVazia(),
        cep: evento.localizacao?.cep ?? '',
        logradouro: evento.localizacao?.logradouro ?? '',
        numero: evento.localizacao?.numero ?? '',
        complemento: evento.localizacao?.complemento ?? '',
        bairro: evento.localizacao?.bairro ?? '',
        cidade: evento.localizacao?.cidade ?? 'Palmas',
        uf: evento.localizacao?.uf ?? 'TO',
        regiao_id: evento.localizacao?.regiao_id ?? null
      }
      formulario.links = evento.links.map((link) => ({ tipo: link.tipo, url: link.url }))
      tocadosLinks.value = formulario.links.map(() => false)
    }
  } catch (errorCarregamento) {
    console.error('[CulturaPMW] Falha ao carregar formulário do evento:', errorCarregamento)
    erro.value = 'Não foi possível carregar os dados necessários. Tente novamente.'
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  erro.value = ''
  enviado.value = true
  ;(Object.keys(tocados) as Campo[]).forEach((campo) => {
    tocados[campo] = true
  })
  tocadosLinks.value = formulario.links.map(() => true)

  if (listaErros.value.length > 0) {
    await nextTick()
    focarCampo(listaErros.value[0].campo)
    return
  }

  let produtor: PerfilProdutorAutenticado | null
  try {
    produtor = await authService.produtorAtual()
  } catch (erroSessao) {
    console.error('[CulturaPMW] Falha ao validar sessão do produtor:', erroSessao)
    erro.value = 'Não foi possível validar sua sessão. Atualize a página e tente novamente.'
    return
  }
  if (!produtor) {
    erro.value = 'Sua sessão expirou. Entre novamente para continuar.'
    return
  }

  const linksPreenchidos = formulario.links.filter((link) => link.url.trim())

  salvando.value = true
  let novaImagemEnviada: string | null = null
  try {
    let imagemUrl = removerImagemAtual.value ? null : formulario.imagem_url
    if (arquivoImagem.value) {
      novaImagemEnviada = await eventoService.enviarImagemEvento(arquivoImagem.value, produtor.id)
      imagemUrl = novaImagemEnviada
    }

    const dados: DadosSalvarEventoProdutor = {
      titulo: formulario.titulo.trim().replace(/\s+/g, ' '),
      descricao: formulario.descricao.trim(),
      imagem_url: imagemUrl,
      categoria_id: formulario.categoria_id,
      data_inicio: new Date(formulario.data_inicio).toISOString(),
      data_fim: new Date(formulario.data_fim).toISOString(),
      gratuito: formulario.gratuito,
      valor_ingresso: formulario.gratuito ? 0 : Number(formulario.valor_ingresso),
      localizacao: localizacaoForm.value?.obterDados() ?? formulario.localizacao,
      links: linksPreenchidos.map((link) => ({ tipo: link.tipo, url: link.url.trim() }))
    }

    await eventoService.salvarEventoProdutor(dados, eventoId.value)

    if (imagemOriginal.value && imagemOriginal.value !== imagemUrl) {
      try {
        await eventoService.removerImagemPorUrl(imagemOriginal.value)
      } catch (erroImagemAntiga) {
        console.warn('[CulturaPMW] O evento foi salvo, mas a imagem antiga não foi removida:', erroImagemAntiga)
      }
    }

    await router.push({
      name: 'produtor-eventos',
      query: { salvo: editando.value ? 'editado' : 'criado' }
    })
  } catch (errorSalvar) {
    console.error('[CulturaPMW] Falha ao salvar evento:', errorSalvar)
    if (novaImagemEnviada) {
      try {
        await eventoService.removerImagemPorUrl(novaImagemEnviada)
      } catch (erroLimpeza) {
        console.warn('[CulturaPMW] Não foi possível limpar a imagem enviada após a falha:', erroLimpeza)
      }
    }
    erro.value =
      errorSalvar instanceof Error
        ? errorSalvar.message
        : 'Não foi possível salvar o evento. Seus dados continuam preenchidos; tente novamente.'
  } finally {
    salvando.value = false
  }
}

onMounted(carregarFormulario)
onBeforeUnmount(limparPreviaTemporaria)
</script>

<template>
  <main class="produtor-area-page evento-form-page">
    <div class="evento-form-shell">
      <nav class="evento-form-topbar" aria-label="Navegação do formulário">
        <RouterLink to="/produtor" class="evento-form-brand" aria-label="Voltar ao painel do produtor">
          <img :src="logoCulturaPMW" alt="CulturaPMW — Eventos que conectam Palmas" />
        </RouterLink>

        <RouterLink to="/produtor/eventos" class="evento-btn-secondary">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          <span>Voltar para Meus eventos</span>
        </RouterLink>
      </nav>

      <section class="evento-form-card" aria-labelledby="evento-form-titulo">
        <header class="evento-form-header">
          <span class="evento-form-eyebrow">
            {{ editando ? 'EDIÇÃO DE EVENTO' : 'PUBLICAÇÃO DE EVENTO' }}
          </span>
          <h1 id="evento-form-titulo">{{ editando ? 'Editar evento' : 'Publicar novo evento' }}</h1>
          <p>
            Preencha as informações da atração para disponibilizá-la na agenda cultural do CulturaPMW.
          </p>
        </header>

        <div class="evento-form-divider" aria-hidden="true"></div>

        <div v-if="carregando" class="evento-form-loading" role="status">
          Carregando informações do formulário...
        </div>

        <div
          v-else-if="erro && editando && !formulario.titulo"
          class="evento-server-error"
          role="alert"
        >
          {{ erro }}
        </div>

        <form v-else class="evento-form" novalidate @submit.prevent="salvar">
          <div
            v-if="enviado && listaErros.length"
            class="evento-error-summary"
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

          <div v-if="erro" class="evento-server-error" role="alert">{{ erro }}</div>

          <section class="evento-secao">
            <div class="evento-secao-titulo">
              <span>01</span>
              <div>
                <h2>Informações principais</h2>
                <p>Apresente os detalhes que ajudam o público a conhecer seu evento.</p>
              </div>
            </div>

            <div class="evento-form-grid">
              <label class="evento-field evento-field-full" :class="{ 'is-invalid': erroDo('titulo') }">
                <span class="evento-field-header">
                  <span>Título do evento <b>*</b></span>
                  <small class="evento-character-count" aria-live="polite">
                    {{ formulario.titulo.length }}/140
                  </small>
                </span>
                <input
                  id="evento-titulo"
                  v-model="formulario.titulo"
                  required
                  maxlength="140"
                  placeholder="Ex.: Festival de Música no Parque"
                  :disabled="salvando"
                  :aria-invalid="Boolean(erroDo('titulo'))"
                  :aria-describedby="erroDo('titulo') ? 'erro-titulo' : undefined"
                  @blur="normalizarTitulo(); marcarTocado('titulo')"
                />
                <small v-if="erroDo('titulo')" id="erro-titulo" class="evento-field-error">
                  {{ erroDo('titulo') }}
                </small>
              </label>

              <label class="evento-field evento-field-full" :class="{ 'is-invalid': erroDo('descricao') }">
                <span class="evento-field-header">
                  <span>Descrição <b>*</b></span>
                  <small class="evento-character-count" aria-live="polite">
                    {{ formulario.descricao.length }}/5000 caracteres
                  </small>
                </span>
                <textarea
                  id="evento-descricao"
                  v-model="formulario.descricao"
                  required
                  maxlength="5000"
                  rows="5"
                  placeholder="Conte ao público sobre a programação, atrações e outras informações importantes..."
                  :disabled="salvando"
                  :aria-invalid="Boolean(erroDo('descricao'))"
                  :aria-describedby="erroDo('descricao') ? 'erro-descricao' : undefined"
                  @blur="marcarTocado('descricao')"
                />
                <small v-if="erroDo('descricao')" id="erro-descricao" class="evento-field-error">
                  {{ erroDo('descricao') }}
                </small>
              </label>

              <label class="evento-field evento-field-full" :class="{ 'is-invalid': erroDo('categoria_id') }">
                <span>Categoria <b>*</b></span>
                <select
                  id="evento-categoria_id"
                  v-model.number="formulario.categoria_id"
                  required
                  :disabled="salvando || categorias.length === 0"
                  :aria-invalid="Boolean(erroDo('categoria_id'))"
                  :aria-describedby="erroDo('categoria_id') ? 'erro-categoria' : undefined"
                  @change="marcarTocado('categoria_id')"
                  @blur="marcarTocado('categoria_id')"
                >
                  <option :value="0" disabled>Selecione uma categoria</option>
                  <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">
                    {{ categoria.nome }}
                  </option>
                </select>
                <small v-if="erroDo('categoria_id')" id="erro-categoria" class="evento-field-error">
                  {{ erroDo('categoria_id') }}
                </small>
                <small v-else-if="categorias.length === 0" class="evento-field-hint">
                  Nenhuma categoria está disponível. Solicite à administração o cadastro de uma categoria.
                </small>
              </label>
            </div>
          </section>

          <section class="evento-secao">
            <div class="evento-secao-titulo">
              <span>02</span>
              <div>
                <h2>Data, horário e entrada</h2>
                <p>Informe quando o evento começa e termina e como será o acesso.</p>
              </div>
            </div>

            <div class="evento-form-grid">
              <label class="evento-field" :class="{ 'is-invalid': erroDo('data_inicio') }">
                <span>Início <b>*</b></span>
                <input
                  id="evento-data_inicio"
                  v-model="formulario.data_inicio"
                  type="datetime-local"
                  required
                  :disabled="salvando"
                  :aria-invalid="Boolean(erroDo('data_inicio'))"
                  :aria-describedby="erroDo('data_inicio') ? 'erro-data-inicio' : undefined"
                  @blur="marcarTocado('data_inicio')"
                />
                <small v-if="erroDo('data_inicio')" id="erro-data-inicio" class="evento-field-error">
                  {{ erroDo('data_inicio') }}
                </small>
              </label>

              <label class="evento-field" :class="{ 'is-invalid': erroDo('data_fim') }">
                <span>Término <b>*</b></span>
                <input
                  id="evento-data_fim"
                  v-model="formulario.data_fim"
                  type="datetime-local"
                  required
                  :disabled="salvando"
                  :aria-invalid="Boolean(erroDo('data_fim'))"
                  :aria-describedby="erroDo('data_fim') ? 'erro-data-fim' : undefined"
                  @blur="marcarTocado('data_fim')"
                />
                <small v-if="erroDo('data_fim')" id="erro-data-fim" class="evento-field-error">
                  {{ erroDo('data_fim') }}
                </small>
              </label>

              <div class="evento-field evento-field-full">
                <span>Entrada <b>*</b></span>
                <label class="evento-checkbox-field">
                  <input
                    v-model="formulario.gratuito"
                    type="checkbox"
                    :disabled="salvando"
                    @change="aoAlterarGratuito"
                  />
                  <span>Este evento possui entrada gratuita</span>
                </label>
              </div>

              <label
                v-if="!formulario.gratuito"
                class="evento-field"
                :class="{ 'is-invalid': erroDo('valor_ingresso') }"
              >
                <span>Valor do ingresso (R$) <b>*</b></span>
                <input
                  id="evento-valor_ingresso"
                  v-model.number="formulario.valor_ingresso"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0,00"
                  :disabled="salvando"
                  :aria-invalid="Boolean(erroDo('valor_ingresso'))"
                  :aria-describedby="erroDo('valor_ingresso') ? 'erro-valor-ingresso' : undefined"
                  @blur="marcarTocado('valor_ingresso')"
                />
                <small v-if="erroDo('valor_ingresso')" id="erro-valor-ingresso" class="evento-field-error">
                  {{ erroDo('valor_ingresso') }}
                </small>
              </label>
            </div>
          </section>

          <section class="evento-secao">
            <div class="evento-secao-titulo">
              <span>03</span>
              <div>
                <h2>Imagem do evento</h2>
                <p>Adicione uma capa para destacar sua publicação. JPG, PNG ou WebP, até 5 MB.</p>
              </div>
            </div>

            <div class="evento-imagem-upload" :class="{ 'is-invalid': erroDo('imagem') }">
              <img
                v-if="previaImagem"
                :src="previaImagem"
                :alt="`Prévia de ${formulario.titulo || 'imagem do evento'}`"
              />
              <div v-else class="evento-imagem-placeholder">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <circle cx="8.5" cy="10" r="1.5" />
                  <path d="m21 15-5-5L6 19" />
                </svg>
                <span>Prévia da capa</span>
              </div>

              <div class="evento-imagem-controles">
                <label class="evento-btn-secondary evento-upload-label">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 16V4m-4 4 4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  </svg>
                  <span>{{ previaImagem ? 'Trocar imagem' : 'Escolher imagem' }}</span>
                  <input
                    id="evento-imagem"
                    ref="inputImagem"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    :disabled="salvando"
                    @change="selecionarImagem"
                  />
                </label>

                <button
                  v-if="previaImagem"
                  type="button"
                  class="evento-btn-danger"
                  :disabled="salvando"
                  @click="removerImagem"
                >
                  Remover imagem
                </button>

                <small v-if="erroDo('imagem')" id="erro-imagem" class="evento-field-error">
                  {{ erroDo('imagem') }}
                </small>
                <small v-else>Formatos aceitos: JPG, PNG ou WebP (tamanho máximo de 5 MB).</small>
              </div>
            </div>
          </section>

          <section id="evento-localizacao" class="evento-secao" @focusout="marcarTocado('localizacao')">
            <div class="evento-secao-titulo">
              <span>04</span>
              <div>
                <h2>Localização</h2>
                <p>O evento deve acontecer em Palmas-TO. A consulta por CEP é opcional.</p>
              </div>
            </div>

            <LocalizacaoEventoForm ref="localizacaoForm" v-model="formulario.localizacao" :disabled="salvando" />
            <small v-if="erroDo('localizacao')" id="erro-localizacao" class="evento-field-error">
              {{ erroDo('localizacao') }}
            </small>
          </section>

          <section class="evento-secao">
            <div class="evento-secao-titulo">
              <span>05</span>
              <div>
                <h2>Links externos</h2>
                <p>Adicione links de ingressos, divulgação, contato ou outras informações.</p>
              </div>
            </div>

            <div v-if="formulario.links.length === 0" class="evento-links-vazio">
              Nenhum link externo adicionado até o momento.
            </div>

            <div
              v-for="(link, indice) in formulario.links"
              :key="indice"
              class="evento-link-linha"
              :class="{ 'is-invalid': erroDoLink(indice) }"
            >
              <label class="evento-field">
                <span>Tipo</span>
                <select v-model="link.tipo" :disabled="salvando">
                  <option v-for="tipo in tiposLink" :key="tipo.valor" :value="tipo.valor">
                    {{ tipo.rotulo }}
                  </option>
                </select>
              </label>

              <label class="evento-field" :class="{ 'is-invalid': erroDoLink(indice) }">
                <span>URL</span>
                <input
                  :id="`evento-link-url-${indice}`"
                  v-model="link.url"
                  type="url"
                  maxlength="2048"
                  placeholder="https://..."
                  :disabled="salvando"
                  :aria-invalid="Boolean(erroDoLink(indice))"
                  :aria-describedby="erroDoLink(indice) ? `erro-link-${indice}` : undefined"
                  @blur="marcarLinkTocado(indice)"
                />
                <small v-if="erroDoLink(indice)" :id="`erro-link-${indice}`" class="evento-field-error">
                  {{ erroDoLink(indice) }}
                </small>
              </label>

              <button
                type="button"
                class="evento-btn-danger evento-remover-link"
                :disabled="salvando"
                @click="removerLink(indice)"
              >
                Remover
              </button>
            </div>

            <div>
              <button
                type="button"
                class="evento-btn-secondary"
                :disabled="salvando || formulario.links.length >= 10"
                @click="adicionarLink"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Adicionar link</span>
              </button>
            </div>
          </section>

          <footer class="evento-form-footer">
            <p class="evento-form-note">
              <strong>* Campos obrigatórios.</strong> Revise os dados antes de publicar na agenda.
            </p>

            <div class="evento-form-actions">
              <RouterLink to="/produtor/eventos" class="evento-btn-secondary">
                Cancelar
              </RouterLink>
              <button
                type="submit"
                class="evento-btn-primary"
                :disabled="salvando || categorias.length === 0"
              >
                <svg v-if="!salvando" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5 9.5 17 19 7.5" />
                </svg>
                <span>{{ salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Publicar evento' }}</span>
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  </main>
</template>