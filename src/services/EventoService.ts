import { supabase } from './supabase'
import { Categoria } from '../models/Categoria'
import { Endereco } from '../models/Endereco'
import { Evento, type SituacaoEvento } from '../models/Evento'
import { LinkExterno, type TipoLink } from '../models/LinkExterno'
import { Produtor } from '../models/Produtor'
import { Regiao } from '../models/Regiao'

export interface FiltrosEventos {
  busca?: string
  categoriaId?: number | null
  regiaoId?: number | null
  gratuito?: 'todos' | 'gratuitos' | 'pagos'
  periodo?: 'todos' | 'hoje' | 'fim-de-semana'
}

export class EventoService {
  private mapearParaEvento(row: Record<string, any>, links: LinkExterno[] = []): Evento {
    const categoria = new Categoria(row.categoria_id, row.categoria_nome)
    const regiao = new Regiao(row.regiao_id, row.regiao_nome)
    const endereco = new Endereco({
      cep: row.cep,
      logradouro: row.logradouro,
      numero: row.numero,
      complemento: row.complemento,
      bairro: row.bairro,
      cidade: row.cidade,
      uf: row.uf,
      regiao
    })
    const produtor = new Produtor({
      id: row.produtor_id,
      nome: row.produtor_nome,
      email: '',
      telefone: row.produtor_telefone,
      descricao: row.produtor_descricao,
      status: 'APROVADO'
    })

    return new Evento({
      id: row.id,
      titulo: row.titulo,
      descricao: row.descricao,
      imagemUrl: row.imagem_url,
      dataInicio: row.data_inicio,
      dataFim: row.data_fim,
      gratuito: row.gratuito,
      valorIngresso: row.valor_ingresso,
      situacao: (row.situacao_atual ?? row.situacao) as SituacaoEvento,
      categoria,
      endereco,
      produtor,
      linksExternos: links
    })
  }

  private obterIntervaloHoje(): { inicio: string; fim: string } {
    const agora = new Date()
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0)
    const fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59)
    return { inicio: inicio.toISOString(), fim: fim.toISOString() }
  }

  private obterIntervaloFimDeSemana(): { inicio: string; fim: string } {
    const agora = new Date()
    const diaSemana = agora.getDay()
    const sabado = new Date(agora)
    sabado.setDate(diaSemana === 0 ? agora.getDate() - 1 : agora.getDate() + (6 - diaSemana))
    sabado.setHours(0, 0, 0, 0)

    const domingo = new Date(sabado)
    domingo.setDate(sabado.getDate() + 1)
    domingo.setHours(23, 59, 59, 999)

    return { inicio: sabado.toISOString(), fim: domingo.toISOString() }
  }

  public async listarPublicos(filtros: FiltrosEventos = {}): Promise<Evento[]> {
    let query = supabase
      .from('vw_eventos_publicos')
      .select('*')
      .order('data_inicio', { ascending: true })

    if (filtros.busca && filtros.busca.trim() !== '') {
      const termo = filtros.busca.trim()
      query = query.or(`titulo.ilike.%${termo}%,descricao.ilike.%${termo}%,bairro.ilike.%${termo}%`)
    }
    if (filtros.categoriaId) query = query.eq('categoria_id', filtros.categoriaId)
    if (filtros.regiaoId) query = query.eq('regiao_id', filtros.regiaoId)
    if (filtros.gratuito === 'gratuitos') query = query.eq('gratuito', true)
    if (filtros.gratuito === 'pagos') query = query.eq('gratuito', false)

    if (filtros.periodo === 'hoje') {
      const { inicio, fim } = this.obterIntervaloHoje()
      query = query.gte('data_inicio', inicio).lte('data_inicio', fim)
    } else if (filtros.periodo === 'fim-de-semana') {
      const { inicio, fim } = this.obterIntervaloFimDeSemana()
      query = query.gte('data_inicio', inicio).lte('data_inicio', fim)
    }

    const { data, error } = await query
    if (error) throw error

    return (data ?? [])
      .map((row) => this.mapearParaEvento(row))
      .filter((evento) => evento.estaVisivel())
  }

  public async buscarPorId(id: string): Promise<Evento | null> {
    const { data: row, error } = await supabase
      .from('vw_eventos_publicos')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!row) return null

    const { data: linksData, error: linksError } = await supabase
      .from('links_externos')
      .select('*')
      .eq('evento_id', id)

    if (linksError) throw linksError

    const links = (linksData ?? []).map(
      (l) => new LinkExterno(l.tipo as TipoLink, l.url, l.id)
    )

    const evento = this.mapearParaEvento(row, links)
    return evento.estaVisivel() ? evento : null
  }

  public async listarCategorias(): Promise<Categoria[]> {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome')
      .order('nome', { ascending: true })

    if (error) throw error
    return (data ?? []).map((c) => new Categoria(c.id, c.nome))
  }

  public async listarRegioes(): Promise<Regiao[]> {
    const { data, error } = await supabase
      .from('regioes')
      .select('id, nome')
      .order('nome', { ascending: true })

    if (error) throw error
    return (data ?? []).map((r) => new Regiao(r.id, r.nome))
  }
}

export const eventoService = new EventoService()