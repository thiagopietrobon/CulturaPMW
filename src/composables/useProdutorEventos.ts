import { computed, ref } from 'vue'
import { useAuth } from './useAuth'
import { authService } from '../services/AuthService'
import {
  eventoService,
  type EventoGerenciadoProdutor
} from '../services/EventoService'

export function formatarData(valor: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(valor))
}

export function formatarLocalizacao(evento: EventoGerenciadoProdutor): string {
  const bairro = evento.localizacao?.bairro?.trim()
  const regiao = evento.localizacao?.regiao?.nome?.trim()

  if (bairro && regiao) {
    if (bairro.toLocaleLowerCase('pt-BR') === regiao.toLocaleLowerCase('pt-BR')) {
      return bairro
    }
    return `${bairro} · ${regiao}`
  }

  return bairro || regiao || 'Localização não cadastrada'
}

export function situacaoTexto(evento: EventoGerenciadoProdutor): string {
  if (evento.situacao === 'OCULTO') return 'Oculto pela administração'
  if (evento.situacao === 'CONCLUIDO' || new Date(evento.data_fim) <= new Date()) {
    return 'Concluído'
  }
  return 'Publicado'
}

export function situacaoClasse(evento: EventoGerenciadoProdutor): string {
  if (evento.situacao === 'OCULTO') return 'is-danger'
  if (evento.situacao === 'CONCLUIDO' || new Date(evento.data_fim) <= new Date()) {
    return 'is-muted'
  }
  return 'is-approved'
}

export function useProdutorEventos() {
  const { perfil } = useAuth()
  const eventos = ref<EventoGerenciadoProdutor[]>([])
  const carregando = ref(true)
  const erro = ref('')

  const resumo = computed(() => {
    const agora = new Date()
    return {
      total: eventos.value.length,
      ativos: eventos.value.filter(
        (evento) => evento.situacao === 'ATIVO' && new Date(evento.data_fim) > agora
      ).length,
      concluidos: eventos.value.filter(
        (evento) => evento.situacao === 'CONCLUIDO' || new Date(evento.data_fim) <= agora
      ).length
    }
  })

  const eventosOrdenados = computed(() =>
    [...eventos.value].sort(
      (a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()
    )
  )

  async function obterProdutorId(): Promise<string> {
    const produtorId = perfil.value?.id ?? (await authService.produtorAtual())?.id
    if (!produtorId) {
      throw new Error('Sua sessão de produtor não está disponível. Entre novamente.')
    }
    return produtorId
  }

  async function carregarEventos(
    mensagemErro = 'Não foi possível carregar seus eventos. Tente novamente.'
  ) {
    carregando.value = true
    erro.value = ''
    try {
      const produtorId = await obterProdutorId()
      eventos.value = await eventoService.listarMeusEventos(produtorId)
    } catch (error) {
      console.error('[CulturaPMW] Falha ao carregar eventos do produtor:', error)
      erro.value = mensagemErro
    } finally {
      carregando.value = false
    }
  }

  return {
    eventos,
    carregando,
    erro,
    resumo,
    eventosOrdenados,
    obterProdutorId,
    carregarEventos,
    formatarData,
    formatarLocalizacao,
    situacaoTexto,
    situacaoClasse
  }
}