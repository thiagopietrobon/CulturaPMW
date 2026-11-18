<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  adminService,
  type CategoriaAdmin,
  type DadosEdicaoEventoAdmin,
  type EventoAdmin,
  type SituacaoEventoAdmin
} from '../../services/AdminService'

const eventos = ref<EventoAdmin[]>([])
const categorias = ref<CategoriaAdmin[]>([])
const regioes = ref<Array<{ id: number; nome: string }>>([])
const busca = ref('')
const situacaoFiltro = ref<'TODOS' | SituacaoEventoAdmin>('TODOS')
const carregando = ref(false)
const erro = ref('')
const sucesso = ref('')
const modalErro = ref('')
const salvando = ref(false)
const eventoEditando = ref<EventoAdmin | null>(null)
const formulario = ref<DadosEdicaoEventoAdmin | null>(null)

const filtrados = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')
  return eventos.value.filter((evento) => {
    const correspondeSituacao = situacaoFiltro.value === 'TODOS' || evento.situacao === situacaoFiltro.value
    const correspondeBusca = !termo || [
      evento.titulo,
      evento.produtor?.profile?.nome ?? '',
      evento.categoria?.nome ?? '',
      evento.localizacao?.bairro ?? ''
    ].some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo))
    return correspondeSituacao && correspondeBusca
  })
})

function dataHora(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
}

function paraDataLocal(valor: string): string {
  const data = new Date(valor)
  return new Date(data.getTime() - data.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function statusTexto(status: SituacaoEventoAdmin): string {
  return { ATIVO: 'Ativo', CONCLUIDO: 'Concluído', OCULTO: 'Oculto' }[status]
}

function statusClasse(status: SituacaoEventoAdmin): string {
  return { ATIVO: 'aprovado', CONCLUIDO: 'concluido', OCULTO: 'suspenso' }[status]
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    const [lista, cats, regs] = await Promise.all([
      adminService.listarEventos(),
      adminService.listarCategorias(),
      adminService.listarRegioes()
    ])
    eventos.value = lista
    categorias.value = cats
    regioes.value = regs
  } catch (error) {
    console.error(error)
    erro.value = 'Não foi possível carregar os eventos. Verifique as permissões de leitura das tabelas relacionadas no Supabase.'
  } finally {
    carregando.value = false
  }
}

function editar(evento: EventoAdmin) {
  modalErro.value = ''
  eventoEditando.value = evento
  formulario.value = {
    titulo: evento.titulo,
    descricao: evento.descricao,
    imagem_url: evento.imagem_url,
    categoria_id: evento.categoria_id,
    data_inicio: paraDataLocal(evento.data_inicio),
    data_fim: paraDataLocal(evento.data_fim),
    gratuito: evento.gratuito,
    valor_ingresso: Number(evento.valor_ingresso ?? 0),
    situacao: evento.situacao,
    localizacao: {
      regiao_id: evento.localizacao?.regiao_id ?? regioes.value[0]?.id ?? 0,
      cep: evento.localizacao?.cep ?? '',
      logradouro: evento.localizacao?.logradouro ?? '',
      numero: evento.localizacao?.numero ?? '',
      complemento: evento.localizacao?.complemento ?? '',
      bairro: evento.localizacao?.bairro ?? '',
      cidade: evento.localizacao?.cidade ?? 'Palmas',
      uf: evento.localizacao?.uf ?? 'TO'
    },
    links: evento.links.map((link) => ({ tipo: link.tipo, url: link.url }))
  }
}

function adicionarLink() {
  formulario.value?.links.push({ tipo: 'OUTRO', url: '' })
}

function removerLink(indice: number) {
  formulario.value?.links.splice(indice, 1)
}

async function salvarEdicao() {
  if (!eventoEditando.value || !formulario.value) return
  modalErro.value = ''
  sucesso.value = ''
  if (new Date(formulario.value.data_fim) <= new Date(formulario.value.data_inicio)) {
    modalErro.value = 'A data e o horário de encerramento devem ser posteriores ao início.'
    return
  }
  if (!formulario.value.localizacao.regiao_id) {
    modalErro.value = 'Selecione a região do evento.'
    return
  }
  if (formulario.value.links.some((link) => link.url.trim() && !/^https?:\/\//i.test(link.url.trim()))) {
    modalErro.value = 'Os links externos precisam começar com http:// ou https://.'
    return
  }

  salvando.value = true
  try {
    const dados: DadosEdicaoEventoAdmin = {
      ...formulario.value,
      imagem_url: formulario.value.imagem_url?.trim() || null,
      data_inicio: new Date(formulario.value.data_inicio).toISOString(),
      data_fim: new Date(formulario.value.data_fim).toISOString(),
      valor_ingresso: formulario.value.gratuito ? 0 : Number(formulario.value.valor_ingresso),
      localizacao: {
        ...formulario.value.localizacao,
        cep: formulario.value.localizacao.cep || null,
        numero: formulario.value.localizacao.numero || null,
        complemento: formulario.value.localizacao.complemento || null
      },
      links: formulario.value.links
        .filter((link) => link.url.trim())
        .map((link) => ({ tipo: link.tipo, url: link.url.trim() }))
    }
    await adminService.atualizarEvento(eventoEditando.value.id, dados)
    eventoEditando.value = null
    formulario.value = null
    sucesso.value = 'Evento atualizado com sucesso.'
    await carregar()
  } catch (error) {
    console.error(error)
    modalErro.value = error instanceof Error ? error.message : 'Não foi possível salvar as alterações do evento.'
  } finally {
    salvando.value = false
  }
}

async function excluir(evento: EventoAdmin) {
  if (!window.confirm(`Remover o evento "${evento.titulo}" da plataforma?`)) return
  erro.value = ''
  sucesso.value = ''
  try {
    await adminService.excluirEvento(evento.id)
    sucesso.value = 'Evento removido da plataforma.'
    await carregar()
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível remover o evento.'
  }
}

function fecharModal() {
  eventoEditando.value = null
  formulario.value = null
}

onMounted(carregar)
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <div class="admin-eyebrow">CULTURAPMW / MODERAÇÃO</div>
        <h1>Eventos</h1>
        <p>Consulte, corrija ou remova publicações da plataforma.</p>
      </div>
      <button class="admin-button admin-button-light" @click="carregar">↻ Atualizar</button>
    </div>

    <div v-if="sucesso" class="admin-alert admin-alert-success">{{ sucesso }}</div>
    <div v-if="erro" class="admin-alert admin-alert-error">{{ erro }}</div>

    <section class="admin-panel">
      <div class="admin-toolbar">
        <div class="admin-field admin-search-field">
          <label for="buscar-evento-admin">Buscar evento</label>
          <input id="buscar-evento-admin" v-model="busca" type="search" placeholder="Título, produtor, categoria ou bairro" />
        </div>
        <div class="admin-field admin-filter-field">
          <label for="filtro-situacao-evento">Situação</label>
          <select id="filtro-situacao-evento" v-model="situacaoFiltro">
            <option value="TODOS">Todas</option>
            <option value="ATIVO">Ativos</option>
            <option value="CONCLUIDO">Concluídos</option>
            <option value="OCULTO">Ocultos</option>
          </select>
        </div>
      </div>

      <div v-if="carregando" class="admin-empty">Carregando eventos...</div>
      <div v-else-if="filtrados.length === 0" class="admin-empty">
        <strong>Nenhum evento encontrado</strong><span>Não há eventos para os filtros selecionados.</span>
      </div>
      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead><tr><th>Evento</th><th>Produtor</th><th>Data</th><th>Situação</th><th class="admin-actions-column">Ações</th></tr></thead>
          <tbody>
            <tr v-for="evento in filtrados" :key="evento.id">
              <td><strong>{{ evento.titulo }}</strong><small>{{ evento.categoria?.nome ?? 'Sem categoria' }} · {{ evento.localizacao?.bairro ?? 'Sem endereço' }}</small></td>
              <td>{{ evento.produtor?.profile?.nome ?? 'Produtor não encontrado' }}<small>{{ evento.produtor?.profile?.email ?? '' }}</small></td>
              <td>{{ dataHora(evento.data_inicio) }}<small>Até {{ dataHora(evento.data_fim) }}</small></td>
              <td><span :class="['admin-status', statusClasse(evento.situacao)]">{{ statusTexto(evento.situacao) }}</span></td>
              <td class="admin-row-actions">
                <button class="admin-button admin-button-light admin-button-small" @click="editar(evento)">Corrigir</button>
                <button class="admin-button admin-button-danger-outline admin-button-small" @click="excluir(evento)">Remover</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="admin-table-footer">{{ filtrados.length }} evento(s) exibido(s)</div>
    </section>

    <div v-if="eventoEditando && formulario" class="admin-modal-backdrop" @click.self="fecharModal">
      <section class="admin-modal admin-modal-wide" role="dialog" aria-modal="true" aria-labelledby="editar-evento-titulo">
        <div class="admin-modal-heading">
          <div><div class="admin-eyebrow">MODERAÇÃO DE CONTEÚDO</div><h2 id="editar-evento-titulo">Corrigir evento</h2></div>
          <button class="admin-modal-close" aria-label="Fechar" @click="fecharModal">×</button>
        </div>
        <form class="admin-form" @submit.prevent="salvarEdicao">
          <div class="admin-form-grid">
            <div class="admin-field field-span-2"><label for="evento-titulo-admin">Título</label><input id="evento-titulo-admin" v-model="formulario.titulo" required maxlength="140" /></div>
            <div class="admin-field field-span-2"><label for="evento-descricao-admin">Descrição</label><textarea id="evento-descricao-admin" v-model="formulario.descricao" required rows="4"></textarea></div>
            <div class="admin-field field-span-2"><label for="evento-imagem-admin">URL da imagem</label><input id="evento-imagem-admin" v-model="formulario.imagem_url" type="url" placeholder="https://..." /></div>
            <div class="admin-field"><label for="evento-categoria-admin">Categoria</label><select id="evento-categoria-admin" v-model.number="formulario.categoria_id" required><option v-for="categoria in categorias" :key="categoria.id" :value="categoria.id">{{ categoria.nome }}</option></select></div>
            <div class="admin-field"><label for="evento-situacao-admin">Situação</label><select id="evento-situacao-admin" v-model="formulario.situacao"><option value="ATIVO">Ativo</option><option value="CONCLUIDO">Concluído</option><option value="OCULTO">Oculto</option></select></div>
            <div class="admin-field"><label for="evento-inicio-admin">Início</label><input id="evento-inicio-admin" v-model="formulario.data_inicio" type="datetime-local" required /></div>
            <div class="admin-field"><label for="evento-fim-admin">Encerramento</label><input id="evento-fim-admin" v-model="formulario.data_fim" type="datetime-local" required /></div>
            <div class="admin-field"><label for="evento-gratuito-admin">Entrada</label><select id="evento-gratuito-admin" v-model="formulario.gratuito"><option :value="true">Gratuito</option><option :value="false">Pago</option></select></div>
            <div v-if="!formulario.gratuito" class="admin-field"><label for="evento-valor-admin">Valor do ingresso (R$)</label><input id="evento-valor-admin" v-model.number="formulario.valor_ingresso" type="number" min="0" step="0.01" /></div>
          </div>

          <div class="admin-form-section"><h3>Localização</h3></div>
          <div class="admin-form-grid">
            <div class="admin-field"><label for="evento-regiao-admin">Região</label><select id="evento-regiao-admin" v-model.number="formulario.localizacao.regiao_id" required><option v-for="regiao in regioes" :key="regiao.id" :value="regiao.id">{{ regiao.nome }}</option></select></div>
            <div class="admin-field"><label for="evento-cep-admin">CEP</label><input id="evento-cep-admin" v-model="formulario.localizacao.cep" maxlength="9" /></div>
            <div class="admin-field field-span-2"><label for="evento-logradouro-admin">Logradouro</label><input id="evento-logradouro-admin" v-model="formulario.localizacao.logradouro" required /></div>
            <div class="admin-field"><label for="evento-numero-admin">Número</label><input id="evento-numero-admin" v-model="formulario.localizacao.numero" /></div>
            <div class="admin-field"><label for="evento-complemento-admin">Complemento</label><input id="evento-complemento-admin" v-model="formulario.localizacao.complemento" /></div>
            <div class="admin-field"><label for="evento-bairro-admin">Bairro</label><input id="evento-bairro-admin" v-model="formulario.localizacao.bairro" required /></div>
            <div class="admin-field"><label for="evento-cidade-admin">Cidade</label><input id="evento-cidade-admin" v-model="formulario.localizacao.cidade" required /></div>
            <div class="admin-field"><label for="evento-uf-admin">UF</label><input id="evento-uf-admin" v-model="formulario.localizacao.uf" maxlength="2" required /></div>
          </div>

          <div class="admin-form-section admin-form-section-row"><h3>Links externos</h3><button type="button" class="admin-button admin-button-light admin-button-small" @click="adicionarLink">+ Adicionar link</button></div>
          <div v-if="formulario.links.length === 0" class="admin-inline-empty">Nenhum link externo cadastrado.</div>
          <div v-for="(link, indice) in formulario.links" :key="indice" class="admin-link-editor">
            <select v-model="link.tipo" :aria-label="`Tipo do link ${indice + 1}`">
              <option value="INGRESSO">Ingressos</option><option value="DIVULGACAO">Divulgação</option><option value="CONTATO">Contato</option><option value="OUTRO">Outro</option>
            </select>
            <input v-model="link.url" type="url" placeholder="https://..." :aria-label="`URL do link ${indice + 1}`" />
            <button type="button" class="admin-icon-button" aria-label="Remover link" @click="removerLink(indice)">×</button>
          </div>

          <p v-if="modalErro" class="admin-alert admin-alert-error">{{ modalErro }}</p>
          <div class="admin-modal-actions">
            <button type="button" class="admin-button admin-button-light" @click="fecharModal">Cancelar</button>
            <button type="submit" class="admin-button admin-button-primary" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Salvar correções' }}</button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>
