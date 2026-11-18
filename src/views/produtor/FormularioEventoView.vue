<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
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
import '../../assets/styles/produtor.css'

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
const eventoId = computed(() => typeof route.params.id === 'string' ? route.params.id : null)
const editando = computed(() => Boolean(eventoId.value))
const localizacaoForm = ref<FormularioLocalizacaoRef | null>(null)
const categorias = ref<Categoria[]>([])
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
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

function limparPreviaTemporaria() {
  if (urlTemporaria) URL.revokeObjectURL(urlTemporaria)
  urlTemporaria = null
}

function selecionarImagem(event: Event) {
  const input = event.target as HTMLInputElement
  const arquivo = input.files?.[0] ?? null
  erro.value = ''
  if (!arquivo) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) {
    erro.value = 'Selecione uma imagem JPG, PNG ou WebP.'
    input.value = ''
    return
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    erro.value = 'A imagem deve possuir no máximo 5 MB.'
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
  arquivoImagem.value = null
  previaImagem.value = ''
  removerImagemAtual.value = true
  if (inputImagem.value) inputImagem.value.value = ''
}

function adicionarLink() {
  formulario.links.push({ tipo: 'OUTRO', url: '' })
}

function removerLink(indice: number) {
  formulario.links.splice(indice, 1)
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

  if (!formulario.titulo.trim()) {
    erro.value = 'Informe o título do evento.'
    return
  }
  if (!formulario.descricao.trim()) {
    erro.value = 'Informe a descrição do evento.'
    return
  }
  if (!formulario.categoria_id) {
    erro.value = 'Selecione uma categoria para o evento.'
    return
  }
  if (!formulario.data_inicio || !formulario.data_fim) {
    erro.value = 'Informe a data e o horário de início e término.'
    return
  }
  if (new Date(formulario.data_fim) <= new Date(formulario.data_inicio)) {
    erro.value = 'A data e o horário de término devem ser posteriores ao início.'
    return
  }
  if (!formulario.gratuito && (!Number.isFinite(Number(formulario.valor_ingresso)) || Number(formulario.valor_ingresso) <= 0)) {
    erro.value = 'Informe um valor de ingresso maior que zero ou marque o evento como gratuito.'
    return
  }

  const erroLocalizacao = localizacaoForm.value?.validar()
  if (erroLocalizacao) {
    erro.value = erroLocalizacao
    return
  }
  const linksPreenchidos = formulario.links.filter((link) => link.url.trim())
  if (linksPreenchidos.some((link) => !validarUrl(link.url.trim()))) {
    erro.value = 'Os links externos devem utilizar endereços iniciados por http:// ou https://.'
    return
  }

  salvando.value = true
  let novaImagemEnviada: string | null = null
  try {
    let imagemUrl = removerImagemAtual.value ? null : formulario.imagem_url
    if (arquivoImagem.value) {
      novaImagemEnviada = await eventoService.enviarImagemEvento(arquivoImagem.value, produtor.id)
      imagemUrl = novaImagemEnviada
    }

    const dados: DadosSalvarEventoProdutor = {
      titulo: formulario.titulo.trim(),
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

    await router.push({ name: 'produtor-eventos', query: { salvo: '1' } })
  } catch (errorSalvar) {
    console.error('[CulturaPMW] Falha ao salvar evento:', errorSalvar)
    if (novaImagemEnviada) {
      try {
        await eventoService.removerImagemPorUrl(novaImagemEnviada)
      } catch (erroLimpeza) {
        console.warn('[CulturaPMW] Não foi possível limpar a imagem enviada após a falha:', erroLimpeza)
      }
    }
    erro.value = errorSalvar instanceof Error
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
  <main class="produtor-area-page">
    <header class="produtor-area-heading">
      <div>
        <p class="produtor-eyebrow">ÁREA DO PRODUTOR / EVENTOS</p>
        <h1>{{ editando ? 'Editar evento' : 'Publicar evento' }}</h1>
        <p>Preencha as informações da atração para disponibilizá-la na agenda do CulturaPMW.</p>
      </div>
      <RouterLink to="/produtor/eventos" class="produtor-button produtor-button-secondary">← Meus eventos</RouterLink>
    </header>

    <div v-if="carregando" class="produtor-data-card">Carregando formulário...</div>
    <div v-else-if="erro && editando && !formulario.titulo" class="produtor-alert produtor-alert-error" role="alert">{{ erro }}</div>

    <form v-else class="produtor-data-card produtor-evento-form" @submit.prevent="salvar">
      <div v-if="erro" class="produtor-alert produtor-alert-error" role="alert">{{ erro }}</div>

      <section class="produtor-evento-secao">
        <div class="produtor-evento-secao-titulo"><span>01</span><div><h2>Informações principais</h2><p>Apresente os detalhes que ajudam o público a conhecer seu evento.</p></div></div>
        <div class="produtor-form-grid">
          <label class="produtor-field produtor-field-full">Título do evento *
            <input v-model="formulario.titulo" required maxlength="140" placeholder="Ex.: Festival de Música no Parque" :disabled="salvando" />
          </label>
          <label class="produtor-field produtor-field-full">Descrição *
            <textarea v-model="formulario.descricao" required maxlength="5000" rows="5" placeholder="Conte ao público sobre a programação, atrações e outras informações importantes..." :disabled="salvando" />
          </label>
          <label class="produtor-field produtor-field-full">Categoria *
            <select v-model.number="formulario.categoria_id" required :disabled="salvando || categorias.length === 0">
              <option :value="0" disabled>Selecione uma categoria</option>
              <option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">{{ categoria.nome }}</option>
            </select>
            <small v-if="categorias.length === 0">Nenhuma categoria está disponível. Solicite à administração o cadastro de uma categoria.</small>
          </label>
        </div>
      </section>

      <section class="produtor-evento-secao">
        <div class="produtor-evento-secao-titulo"><span>02</span><div><h2>Data, horário e entrada</h2><p>Informe quando o evento começa e termina.</p></div></div>
        <div class="produtor-form-grid">
          <label class="produtor-field">Início *<input v-model="formulario.data_inicio" type="datetime-local" required :disabled="salvando" /></label>
          <label class="produtor-field">Término *<input v-model="formulario.data_fim" type="datetime-local" required :disabled="salvando" /></label>
          <div class="produtor-field produtor-field-full">
            <span>Entrada *</span>
            <label class="produtor-checkbox-field"><input v-model="formulario.gratuito" type="checkbox" :disabled="salvando" /> Este evento é gratuito</label>
          </div>
          <label v-if="!formulario.gratuito" class="produtor-field">Valor do ingresso (R$) *
            <input v-model.number="formulario.valor_ingresso" type="number" min="0.01" step="0.01" required placeholder="0,00" :disabled="salvando" />
          </label>
        </div>
      </section>

      <section class="produtor-evento-secao">
        <div class="produtor-evento-secao-titulo"><span>03</span><div><h2>Imagem do evento</h2><p>Adicione uma imagem para destacar sua publicação. JPG, PNG ou WebP, até 5 MB.</p></div></div>
        <div class="produtor-imagem-upload">
          <img v-if="previaImagem" :src="previaImagem" :alt="`Prévia de ${formulario.titulo || 'imagem do evento'}`" />
          <div v-else class="produtor-imagem-placeholder">Prévia da imagem</div>
          <div class="produtor-imagem-controles">
            <label class="produtor-button produtor-button-secondary produtor-upload-label">
              Escolher imagem
              <input ref="inputImagem" type="file" accept="image/jpeg,image/png,image/webp" :disabled="salvando" @change="selecionarImagem" />
            </label>
            <button v-if="previaImagem" type="button" class="produtor-button produtor-button-danger" :disabled="salvando" @click="removerImagem">Remover imagem</button>
            <small>A imagem é pública e será armazenada no Supabase Storage.</small>
          </div>
        </div>
      </section>

      <section class="produtor-evento-secao">
        <div class="produtor-evento-secao-titulo"><span>04</span><div><h2>Localização</h2><p>O evento deve acontecer em Palmas-TO. A consulta por CEP é opcional.</p></div></div>
        <LocalizacaoEventoForm ref="localizacaoForm" v-model="formulario.localizacao" :disabled="salvando" />
      </section>

      <section class="produtor-evento-secao">
        <div class="produtor-evento-secao-titulo"><span>05</span><div><h2>Links externos</h2><p>Adicione links de ingressos, divulgação, contato ou outras informações.</p></div></div>
        <div v-if="formulario.links.length === 0" class="produtor-links-vazio">Nenhum link externo adicionado.</div>
        <div v-for="(link, indice) in formulario.links" :key="indice" class="produtor-link-linha">
          <label class="produtor-field">Tipo
            <select v-model="link.tipo" :disabled="salvando">
              <option v-for="tipo in tiposLink" :key="tipo.valor" :value="tipo.valor">{{ tipo.rotulo }}</option>
            </select>
          </label>
          <label class="produtor-field">URL
            <input v-model="link.url" type="url" maxlength="2048" placeholder="https://..." :disabled="salvando" />
          </label>
          <button type="button" class="produtor-button produtor-button-danger produtor-remover-link" :disabled="salvando" @click="removerLink(indice)">Remover</button>
        </div>
        <button type="button" class="produtor-button produtor-button-secondary" :disabled="salvando || formulario.links.length >= 10" @click="adicionarLink">+ Adicionar link</button>
      </section>

      <div class="produtor-form-actions produtor-evento-form-actions">
        <button type="submit" class="produtor-button produtor-button-primary" :disabled="salvando || categorias.length === 0">
          {{ salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Publicar evento' }}
        </button>
        <RouterLink to="/produtor/eventos" class="produtor-button produtor-button-secondary">Cancelar</RouterLink>
      </div>
    </form>
  </main>
</template>

<style scoped>
.produtor-evento-form{max-width:950px;display:flex;flex-direction:column;gap:25px}
.produtor-evento-secao{display:flex;flex-direction:column;gap:16px;padding-bottom:23px;border-bottom:1px solid #edf0f5}
.produtor-evento-secao:last-of-type{border-bottom:0}
.produtor-evento-secao-titulo{display:flex;align-items:flex-start;gap:12px}
.produtor-evento-secao-titulo>span{display:grid;width:30px;height:30px;flex:none;place-items:center;border-radius:8px;background:#edf4ff;color:#1154d9;font-size:11px;font-weight:800}
.produtor-evento-secao-titulo h2{margin:0;color:#172b49;font-size:17px}
.produtor-evento-secao-titulo p{margin:5px 0 0;color:#68768b;font-size:11px;line-height:1.5}
.produtor-checkbox-field{display:flex;align-items:center;gap:8px;color:#43536b;font-size:12px;font-weight:500}
.produtor-checkbox-field input{width:16px;height:16px;accent-color:#1154d9}
.produtor-imagem-upload{display:grid;grid-template-columns:minmax(0,260px) minmax(0,1fr);gap:16px;align-items:center}
.produtor-imagem-upload img,.produtor-imagem-placeholder{width:100%;height:155px;border:1px solid #e1e7ef;border-radius:9px;object-fit:cover}
.produtor-imagem-placeholder{display:grid;place-items:center;background:#f6f8fb;color:#8592a5;font-size:12px}
.produtor-imagem-controles{display:flex;flex-wrap:wrap;align-items:center;gap:9px}
.produtor-imagem-controles small{flex-basis:100%;color:#738096;font-size:10px}
.produtor-upload-label{position:relative;overflow:hidden}.produtor-upload-label input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
.produtor-links-vazio{padding:13px;border:1px dashed #dce3ed;border-radius:8px;color:#738096;font-size:11px}
.produtor-link-linha{display:grid;grid-template-columns:220px minmax(0,1fr) auto;gap:10px;align-items:end;padding:13px;border:1px solid #e6ebf2;border-radius:9px}
.produtor-remover-link{min-height:40px}
.produtor-evento-form-actions{padding-top:3px}
.produtor-evento-form-actions .produtor-button-primary{min-width:190px}
@media(max-width:680px){.produtor-imagem-upload{grid-template-columns:1fr}.produtor-imagem-upload img,.produtor-imagem-placeholder{max-width:100%;height:190px}.produtor-link-linha{grid-template-columns:1fr}.produtor-remover-link{justify-self:start}.produtor-evento-form-actions .produtor-button{width:100%}}
</style>
