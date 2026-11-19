<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  adminService,
  type ProdutorAdmin,
  type StatusProdutorAdmin
} from '../../services/AdminService'

const route = useRoute()
const produtores = ref<ProdutorAdmin[]>([])
const statusInicial = typeof route.query.status === 'string' &&
  ['AGUARDANDO_APROVACAO', 'APROVADO', 'REPROVADO', 'SUSPENSO', 'TODOS'].includes(route.query.status)
  ? route.query.status as StatusProdutorAdmin | 'TODOS'
  : 'TODOS'
const statusFiltro = ref<StatusProdutorAdmin | 'TODOS'>(statusInicial)
const busca = ref('')
const carregando = ref(false)
const erro = ref('')
const sucesso = ref('')
const operandoId = ref<string | null>(null)
const produtorSuspensao = ref<ProdutorAdmin | null>(null)
const suspensaoAte = ref('')
const modalErro = ref('')

const produtoresFiltrados = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')
  if (!termo) return produtores.value
  return produtores.value.filter((p) =>
    [p.nome, p.email, p.cpf_cnpj, p.telefone].some((v) => v.toLocaleLowerCase('pt-BR').includes(termo))
  )
})

function statusTexto(status: StatusProdutorAdmin): string {
  const textos: Record<StatusProdutorAdmin, string> = {
    AGUARDANDO_APROVACAO: 'Aguardando aprovação',
    APROVADO: 'Aprovado',
    REPROVADO: 'Reprovado',
    SUSPENSO: 'Suspenso'
  }
  return textos[status]
}

function statusClasse(status: StatusProdutorAdmin): string {
  return {
    AGUARDANDO_APROVACAO: 'pendente',
    APROVADO: 'aprovado',
    REPROVADO: 'reprovado',
    SUSPENSO: 'suspenso'
  }[status]
}

function dataHora(valor: string | null): string {
  if (!valor) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor))
}

async function carregar() {
  carregando.value = true
  erro.value = ''
  try {
    produtores.value = await adminService.listarProdutores(statusFiltro.value)
  } catch (error) {
    console.error(error)
    erro.value = 'Não foi possível carregar os produtores. Confira as políticas RLS do Supabase.'
  } finally {
    carregando.value = false
  }
}

function notificar(mensagem: string) {
  sucesso.value = mensagem
  window.setTimeout(() => { sucesso.value = '' }, 4500)
}

async function executarAcao(id: string, acao: () => Promise<void>, mensagem: string): Promise<boolean> {
  operandoId.value = id
  erro.value = ''
  try {
    await acao()
    notificar(mensagem)
    await carregar()
    return true
  } catch (error) {
    console.error(error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível concluir a operação.'
    return false
  } finally {
    operandoId.value = null
  }
}

async function aprovar(produtor: ProdutorAdmin) {
  await executarAcao(produtor.id, () => adminService.aprovarProdutor(produtor.id), 'Cadastro aprovado. O produtor já pode publicar eventos.')
}

async function reprovar(produtor: ProdutorAdmin) {
  if (!window.confirm(`Reprovar o cadastro de ${produtor.nome}?`)) return
  await executarAcao(produtor.id, () => adminService.reprovarProdutor(produtor.id), 'Cadastro reprovado.')
}

function abrirSuspensao(produtor: ProdutorAdmin) {
  produtorSuspensao.value = produtor
  modalErro.value = ''
  const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000)
  amanha.setMinutes(0, 0, 0)
  suspensaoAte.value = new Date(amanha.getTime() - amanha.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

async function confirmarSuspensao() {
  if (!produtorSuspensao.value) return
  modalErro.value = ''
  const suspenso = await executarAcao(
    produtorSuspensao.value.id,
    () => adminService.suspenderProdutor(produtorSuspensao.value!.id, suspensaoAte.value),
    'Produtor suspenso até a data informada.'
  )
  if (suspenso) {
    produtorSuspensao.value = null
  } else {
    modalErro.value = erro.value
    erro.value = ''
  }
}

async function reativar(produtor: ProdutorAdmin) {
  if (!window.confirm(`Reativar ${produtor.nome} e liberar novamente o gerenciamento de eventos?`)) return
  await executarAcao(produtor.id, () => adminService.reativarProdutor(produtor.id), 'Produtor reativado.')
}

async function excluir(produtor: ProdutorAdmin) {
  if (!window.confirm(`Excluir permanentemente o produtor ${produtor.nome} e todos os eventos associados? Esta ação não pode ser desfeita.`)) return
  await executarAcao(produtor.id, () => adminService.excluirProdutor(produtor.id), 'Produtor e conteúdos associados removidos.')
}

watch(statusFiltro, carregar)
watch(() => route.query.status, (status) => {
  if (typeof status === 'string' && ['AGUARDANDO_APROVACAO', 'APROVADO', 'REPROVADO', 'SUSPENSO', 'TODOS'].includes(status)) {
    statusFiltro.value = status as StatusProdutorAdmin | 'TODOS'
  }
})
onMounted(carregar)
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <div class="admin-eyebrow">CULTURAPMW / GERENCIAMENTO</div>
        <h1>Produtores</h1>
        <p>Analise solicitações, gerencie contas e controle suspensões.</p>
      </div>
      <button class="admin-button admin-button-light" type="button" @click="carregar">↻ Atualizar</button>
    </div>

    <div v-if="sucesso" class="admin-alert admin-alert-success">{{ sucesso }}</div>
    <div v-if="erro" class="admin-alert admin-alert-error">{{ erro }}</div>

    <section class="admin-panel">
      <div class="admin-toolbar">
        <div class="admin-field admin-search-field">
          <label for="busca-produtor">Buscar produtor</label>
          <input id="busca-produtor" v-model="busca" type="search" placeholder="Nome, e-mail, CPF/CNPJ ou telefone" />
        </div>
        <div class="admin-field admin-filter-field">
          <label for="filtro-status-produtor">Situação do cadastro</label>
          <select id="filtro-status-produtor" v-model="statusFiltro">
            <option value="TODOS">Todos</option>
            <option value="AGUARDANDO_APROVACAO">Aguardando aprovação</option>
            <option value="APROVADO">Aprovados</option>
            <option value="REPROVADO">Reprovados</option>
            <option value="SUSPENSO">Suspensos</option>
          </select>
        </div>
      </div>

      <div v-if="carregando" class="admin-empty">Carregando produtores...</div>
      <div v-else-if="produtoresFiltrados.length === 0" class="admin-empty">
        <strong>Nenhum produtor encontrado</strong>
        <span>Não há cadastros para os filtros selecionados.</span>
      </div>
      <div v-else class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Produtor</th><th>Documento / telefone</th><th>Situação</th><th>Suspenso até</th><th class="admin-actions-column">Ações</th></tr>
          </thead>
          <tbody>
            <tr v-for="produtor in produtoresFiltrados" :key="produtor.id">
              <td>
                <strong>{{ produtor.nome }}</strong>
                <small>{{ produtor.email }}</small>
              </td>
              <td>{{ produtor.cpf_cnpj }}<small>{{ produtor.telefone }}</small></td>
              <td><span :class="['admin-status', statusClasse(produtor.status)]">{{ statusTexto(produtor.status) }}</span></td>
              <td>{{ produtor.status === 'SUSPENSO' ? dataHora(produtor.suspenso_ate) : '—' }}</td>
              <td class="admin-row-actions">
                <template v-if="produtor.status === 'AGUARDANDO_APROVACAO'">
                  <button class="admin-button admin-button-success admin-button-small" :disabled="operandoId === produtor.id" @click="aprovar(produtor)">Aprovar</button>
                  <button class="admin-button admin-button-danger-outline admin-button-small" :disabled="operandoId === produtor.id" @click="reprovar(produtor)">Reprovar</button>
                </template>
                <template v-else-if="produtor.status === 'APROVADO'">
                  <button class="admin-button admin-button-light admin-button-small" :disabled="operandoId === produtor.id" @click="abrirSuspensao(produtor)">Suspender</button>
                  <button class="admin-button admin-button-danger-outline admin-button-small" :disabled="operandoId === produtor.id" @click="excluir(produtor)">Excluir</button>
                </template>
                <template v-else-if="produtor.status === 'SUSPENSO'">
                  <button class="admin-button admin-button-success admin-button-small" :disabled="operandoId === produtor.id" @click="reativar(produtor)">Reativar</button>
                  <button class="admin-button admin-button-danger-outline admin-button-small" :disabled="operandoId === produtor.id" @click="excluir(produtor)">Excluir</button>
                </template>
                <template v-else>
                  <button class="admin-button admin-button-light admin-button-small" :disabled="operandoId === produtor.id" @click="aprovar(produtor)">Aprovar novamente</button>
                  <button class="admin-button admin-button-danger-outline admin-button-small" :disabled="operandoId === produtor.id" @click="excluir(produtor)">Excluir</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="admin-table-footer">{{ produtoresFiltrados.length }} produtor(es) exibido(s)</div>
    </section>

    <div v-if="produtorSuspensao" class="admin-modal-backdrop" @click.self="produtorSuspensao = null">
      <section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="suspender-titulo">
        <div class="admin-modal-heading">
          <div><div class="admin-eyebrow">AÇÃO ADMINISTRATIVA</div><h2 id="suspender-titulo">Suspender produtor</h2></div>
          <button class="admin-modal-close" aria-label="Fechar" @click="produtorSuspensao = null">×</button>
        </div>
        <p>O produtor <strong>{{ produtorSuspensao.nome }}</strong> ficará impedido de publicar e editar eventos até a data escolhida. Seus eventos deverão ficar ocultos durante a suspensão.</p>
        <div class="admin-field">
          <label for="suspensao-ate">Suspender até</label>
          <input id="suspensao-ate" v-model="suspensaoAte" type="datetime-local" required />
        </div>
        <p v-if="modalErro" class="admin-alert admin-alert-error">{{ modalErro }}</p>
        <div class="admin-modal-actions">
          <button class="admin-button admin-button-light" @click="produtorSuspensao = null">Cancelar</button>
          <button class="admin-button admin-button-primary" @click="confirmarSuspensao">Confirmar suspensão</button>
        </div>
      </section>
    </div>
  </section>
</template>
