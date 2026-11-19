<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRoute } from 'vue-router'
import { authService } from '../../services/AuthService'
import {
  eventoService,
  type EventoGerenciadoProdutor
} from '../../services/EventoService'
import '../../assets/styles/produtor.css'

const route = useRoute()
const eventos = ref<EventoGerenciadoProdutor[]>([])
const carregando = ref(true)
const erro = ref('')
const sucesso = ref('')
const excluindoId = ref<string | null>(null)

const resumo = computed(() => ({
  total: eventos.value.length,
  ativos: eventos.value.filter((evento) => evento.situacao === 'ATIVO' && new Date(evento.data_fim) > new Date()).length,
  concluidos: eventos.value.filter((evento) => evento.situacao === 'CONCLUIDO' || new Date(evento.data_fim) <= new Date()).length
}))

function formatarData(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(valor))
}

function situacaoTexto(evento: EventoGerenciadoProdutor): string {
  if (evento.situacao === 'OCULTO') return 'Oculto pela administração'
  if (evento.situacao === 'CONCLUIDO' || new Date(evento.data_fim) <= new Date()) return 'Concluído'
  return 'Publicado'
}

function situacaoClasse(evento: EventoGerenciadoProdutor): string {
  if (evento.situacao === 'OCULTO') return 'produtor-evento-status-oculto'
  if (evento.situacao === 'CONCLUIDO' || new Date(evento.data_fim) <= new Date()) return 'produtor-evento-status-concluido'
  return 'produtor-evento-status-ativo'
}

async function carregarEventos() {
  carregando.value = true
  erro.value = ''
  try {
    const produtor = await authService.produtorAtual()
    if (!produtor) throw new Error('Sua sessão de produtor não está disponível. Entre novamente.')
    eventos.value = await eventoService.listarMeusEventos(produtor.id)
  } catch (error) {
    console.error('[CulturaPMW] Falha ao carregar eventos do produtor:', error)
    erro.value = 'Não foi possível carregar seus eventos. Tente novamente.'
  } finally {
    carregando.value = false
  }
}

async function excluirEvento(evento: EventoGerenciadoProdutor) {
  const confirmar = window.confirm(`Deseja realmente excluir o evento "${evento.titulo}"? Essa ação não pode ser desfeita.`)
  if (!confirmar) return

  excluindoId.value = evento.id
  erro.value = ''
  sucesso.value = ''
  try {
    const produtor = await authService.produtorAtual()
    if (!produtor) throw new Error('Sua sessão de produtor não está disponível. Entre novamente.')
    await eventoService.excluirMeuEvento(evento.id, produtor.id)
    sucesso.value = 'Evento excluído com sucesso.'
    await carregarEventos()
  } catch (error) {
    console.error('[CulturaPMW] Falha ao excluir evento:', error)
    erro.value = error instanceof Error ? error.message : 'Não foi possível excluir o evento. Tente novamente.'
  } finally {
    excluindoId.value = null
  }
}

onMounted(async () => {
  if (route.query.salvo === '1') sucesso.value = 'Evento salvo com sucesso.'
  await carregarEventos()
})
</script>

<template>
  <main class="produtor-area-page">
    <header class="produtor-area-heading">
      <div>
        <p class="produtor-eyebrow">ÁREA DO PRODUTOR</p>
        <h1>Meus eventos</h1>
        <p>Publique e mantenha atualizadas as informações das suas atrações.</p>
      </div>
      <RouterLink to="/produtor/eventos/novo" class="produtor-button produtor-button-primary">
        + Publicar evento
      </RouterLink>
    </header>

    <div class="produtor-eventos-resumo">
      <article><strong>{{ resumo.total }}</strong><span>Eventos cadastrados</span></article>
      <article><strong>{{ resumo.ativos }}</strong><span>Em andamento / publicados</span></article>
      <article><strong>{{ resumo.concluidos }}</strong><span>Concluídos</span></article>
    </div>

    <div v-if="sucesso" class="produtor-alert produtor-alert-success" role="status">{{ sucesso }}</div>
    <div v-if="erro" class="produtor-alert produtor-alert-error" role="alert">
      {{ erro }}
      <button type="button" class="produtor-inline-action" @click="carregarEventos">Tentar novamente</button>
    </div>

    <div v-if="carregando" class="produtor-data-card produtor-eventos-vazio">Carregando seus eventos...</div>
    <section v-else-if="eventos.length === 0" class="produtor-data-card produtor-eventos-vazio">
      <span class="produtor-dashboard-icon">▣</span>
      <h2>Você ainda não publicou eventos</h2>
      <p>Comece cadastrando uma atração cultural, esportiva ou de lazer em Palmas.</p>
      <RouterLink to="/produtor/eventos/novo" class="produtor-button produtor-button-primary">Publicar meu primeiro evento</RouterLink>
    </section>

    <section v-else class="produtor-eventos-lista" aria-label="Eventos cadastrados">
      <article v-for="evento in eventos" :key="evento.id" class="produtor-evento-card">
        <img v-if="evento.imagem_url" :src="evento.imagem_url" :alt="evento.titulo" class="produtor-evento-imagem" />
        <div v-else class="produtor-evento-imagem produtor-evento-imagem-vazia">CulturaPMW</div>
        <div class="produtor-evento-conteudo">
          <div class="produtor-evento-meta">
            <span>{{ evento.categoria?.nome ?? 'Categoria indisponível' }}</span>
            <span :class="['produtor-evento-status', situacaoClasse(evento)]">{{ situacaoTexto(evento) }}</span>
          </div>
          <h2>{{ evento.titulo }}</h2>
          <p class="produtor-evento-descricao">{{ evento.descricao }}</p>
          <div class="produtor-evento-infos">
            <span>Início: {{ formatarData(evento.data_inicio) }}</span>
            <span>Término: {{ formatarData(evento.data_fim) }}</span>
            <span>{{ evento.localizacao?.bairro ?? 'Localização não cadastrada' }} · {{ evento.localizacao?.regiao?.nome ?? 'Sem região' }}</span>
            <strong>{{ evento.gratuito ? 'Gratuito' : `R$ ${Number(evento.valor_ingresso ?? 0).toFixed(2).replace('.', ',')}` }}</strong>
          </div>
          <div class="produtor-evento-acoes">
            <RouterLink :to="`/produtor/eventos/${evento.id}/editar`" class="produtor-button produtor-button-secondary">Editar</RouterLink>
            <RouterLink v-if="evento.situacao !== 'OCULTO' && new Date(evento.data_fim) > new Date()" :to="`/eventos/${evento.id}`" class="produtor-button produtor-button-secondary">Visualizar página</RouterLink>
            <button type="button" class="produtor-button produtor-button-danger" :disabled="excluindoId === evento.id" @click="excluirEvento(evento)">
              {{ excluindoId === evento.id ? 'Excluindo...' : 'Excluir' }}
            </button>
          </div>
        </div>
      </article>
    </section>

    <RouterLink to="/produtor/painel" class="produtor-back-link">← Voltar ao painel do produtor</RouterLink>
  </main>
</template>

<style scoped>
.produtor-eventos-resumo{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px}
.produtor-eventos-resumo article{display:flex;flex-direction:column;gap:4px;padding:16px 18px;border:1px solid #e1e7ef;border-radius:10px;background:#fff}
.produtor-eventos-resumo strong{color:#172b49;font-size:23px}.produtor-eventos-resumo span{color:#68768b;font-size:11px}
.produtor-eventos-vazio{display:flex;flex-direction:column;align-items:center;gap:10px;padding:42px 20px;text-align:center}
.produtor-eventos-vazio h2{margin:0;color:#172b49;font-size:18px}.produtor-eventos-vazio p{max-width:460px;margin:0 0 8px;color:#68768b;font-size:12px;line-height:1.6}
.produtor-eventos-lista{display:grid;gap:14px}
.produtor-evento-card{display:grid;grid-template-columns:190px minmax(0,1fr);overflow:hidden;border:1px solid #e1e7ef;border-radius:12px;background:#fff}
.produtor-evento-imagem{width:100%;height:100%;min-height:190px;max-height:250px;object-fit:cover}
.produtor-evento-imagem-vazia{display:grid;place-items:center;background:#edf4ff;color:#1154d9;font-size:19px;font-weight:800}
.produtor-evento-conteudo{min-width:0;padding:18px}
.produtor-evento-meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;color:#60718a;font-size:10px;font-weight:700}
.produtor-evento-status{padding:5px 8px;border-radius:999px;font-size:10px}.produtor-evento-status-ativo{background:#eaf8ef;color:#197245}.produtor-evento-status-concluido{background:#eef1f5;color:#56657b}.produtor-evento-status-oculto{background:#fff0f0;color:#b32c38}
.produtor-evento-conteudo h2{margin:9px 0 6px;color:#172b49;font-size:18px}.produtor-evento-descricao{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;margin:0;color:#68768b;font-size:12px;line-height:1.55}
.produtor-evento-infos{display:flex;flex-wrap:wrap;gap:8px 15px;margin-top:13px;color:#52627a;font-size:11px}.produtor-evento-infos strong{color:#172b49}
.produtor-evento-acoes{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}.produtor-inline-action{margin-left:8px;border:0;background:transparent;color:#a72e38;font-weight:800;text-decoration:underline;cursor:pointer}
@media(max-width:680px){.produtor-eventos-resumo{grid-template-columns:1fr}.produtor-evento-card{grid-template-columns:1fr}.produtor-evento-imagem{height:180px;min-height:0}.produtor-evento-acoes .produtor-button{flex:1}}
</style>
