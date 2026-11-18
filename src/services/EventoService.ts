import { supabase } from './supabase'
import { Categoria } from '../models/Categoria'
import { Endereco } from '../models/Endereco'
import { Evento, type SituacaoEvento } from '../models/Evento'
import { LinkExterno, type TipoLink } from '../models/LinkExterno'
import { Produtor } from '../models/Produtor'
import { Regiao } from '../models/Regiao'
import type { DadosLocalizacaoEvento } from './LocalizacaoService'

export interface FiltrosEventos {
  busca?: string
  categoriaId?: number | null
  regiaoId?: number | null
  gratuito?: 'todos' | 'gratuitos' | 'pagos'
  periodo?: 'todos' | 'hoje' | 'fim-de-semana'
}

export interface DadosSalvarEventoProdutor {
  titulo: string
  descricao: string
  imagem_url: string | null
  categoria_id: number
  data_inicio: string
  data_fim: string
  gratuito: boolean
  valor_ingresso: number
  localizacao: DadosLocalizacaoEvento
  links: Array<{ tipo: TipoLink; url: string }>
}

export interface EventoGerenciadoProdutor {
  id: string
  produtor_id: string
  categoria_id: number
  titulo: string
  descricao: string
  imagem_url: string | null
  data_inicio: string
  data_fim: string
  gratuito: boolean
  valor_ingresso: number | string | null
  situacao: SituacaoEvento
  created_at: string | null
  categoria: { id: number; nome: string } | null
  localizacao: (DadosLocalizacaoEvento & { regiao?: { id: number; nome: string } | null }) | null
  links: Array<{ id: string; tipo: TipoLink; url: string }>
}

const BUCKET_IMAGENS_EVENTOS = 'eventos-imagens'
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024
const TIPOS_IMAGEM_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

function extrairRelacao<T>(valor: T | T[] | null | undefined): T | null {
  return Array.isArray(valor) ? valor[0] ?? null : valor ?? null
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

  public async buscarProdutorPorId(produtorId: string): Promise<Produtor | null> {
    // A view pública expõe somente nome, telefone e descrição do produtor aprovado.
    // E-mail e CPF/CNPJ permanecem restritos ao próprio produtor e à administração.
    const { data, error } = await supabase
      .from('vw_produtores_publicos')
      .select('id, nome, telefone, descricao')
      .eq('id', produtorId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return new Produtor({
      id: data.id,
      nome: data.nome,
      email: '',
      telefone: data.telefone,
      descricao: data.descricao,
      status: 'APROVADO'
    })
  }

  public async listarEventosPorProdutor(produtorId: string): Promise<Evento[]> {
    const { data, error } = await supabase
      .from('vw_eventos_publicos')
      .select('*')
      .eq('produtor_id', produtorId)
      .order('data_inicio', { ascending: true })

    if (error) throw error

    return (data ?? [])
      .map((row) => this.mapearParaEvento(row))
      .filter((evento) => evento.estaVisivel())
  }

  /** Lista todos os eventos do produtor, inclusive ocultos e encerrados, na área autenticada. */
  public async listarMeusEventos(produtorId: string): Promise<EventoGerenciadoProdutor[]> {
    if (!produtorId) throw new Error('Não foi possível identificar o produtor autenticado.')

    const { data, error } = await supabase
      .from('eventos')
      .select(`
        id, produtor_id, categoria_id, titulo, descricao, imagem_url,
        data_inicio, data_fim, gratuito, valor_ingresso, situacao, created_at,
        categoria:categorias!eventos_categoria_id_fkey ( id, nome ),
        localizacao:localizacoes!localizacoes_evento_id_fkey (
          cep, logradouro, numero, complemento, bairro, cidade, uf, regiao_id,
          regiao:regioes!localizacoes_regiao_id_fkey ( id, nome )
        ),
        links:links_externos!links_externos_evento_id_fkey ( id, tipo, url )
      `)
      .eq('produtor_id', produtorId)
      .order('data_inicio', { ascending: true })

    if (error) throw error

    return (data ?? []).map((item: any) => {
      const categoria = extrairRelacao(item.categoria)
      const localizacao = extrairRelacao(item.localizacao)
      if (localizacao) localizacao.regiao = extrairRelacao(localizacao.regiao)

      return {
        ...item,
        categoria,
        localizacao,
        links: item.links ?? []
      } as EventoGerenciadoProdutor
    })
  }

  public async buscarMeuEvento(eventoId: string, produtorId: string): Promise<EventoGerenciadoProdutor | null> {
    if (!eventoId || !produtorId) return null

    const eventos = await this.listarMeusEventos(produtorId)
    return eventos.find((evento) => evento.id === eventoId) ?? null
  }

  /** Salva evento, localização e links em uma única transação via RPC. */
  public async salvarEventoProdutor(
    dados: DadosSalvarEventoProdutor,
    eventoId: string | null = null
  ): Promise<string> {
    const { data, error } = await supabase.rpc('produtor_salvar_evento', {
      p_evento_id: eventoId,
      p_dados: dados
    })

    if (error) throw error
    if (!data) throw new Error('O evento não retornou um identificador após o salvamento.')
    return data as string
  }

  public async excluirMeuEvento(eventoId: string, produtorId: string): Promise<void> {
    const evento = await this.buscarMeuEvento(eventoId, produtorId)
    if (!evento) throw new Error('Evento não encontrado ou não pertence à sua conta.')

    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', eventoId)
      .eq('produtor_id', produtorId)

    if (error) throw error

    if (evento.imagem_url) {
      try {
        await this.removerImagemPorUrl(evento.imagem_url)
      } catch (storageError) {
        // A exclusão do evento já foi concluída no banco. Uma falha de limpeza
        // no Storage não deve fazer a interface informar que o evento continua existindo.
        console.warn('[CulturaPMW] Não foi possível remover a imagem antiga do Storage:', storageError)
      }
    }
  }

  public async enviarImagemEvento(arquivo: File, produtorId: string): Promise<string> {
    if (!produtorId) throw new Error('Não foi possível identificar o produtor autenticado.')
    if (!TIPOS_IMAGEM_PERMITIDOS.includes(arquivo.type)) {
      throw new Error('Envie uma imagem nos formatos JPG, PNG ou WebP.')
    }
    if (arquivo.size <= 0 || arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
      throw new Error('A imagem deve possuir no máximo 5 MB.')
    }

    const extensao = arquivo.type === 'image/jpeg' ? 'jpg' : arquivo.type.split('/')[1]
    const caminho = `${produtorId}/${crypto.randomUUID()}.${extensao}`
    const { error } = await supabase.storage
      .from(BUCKET_IMAGENS_EVENTOS)
      .upload(caminho, arquivo, {
        cacheControl: '3600',
        contentType: arquivo.type,
        upsert: false
      })

    if (error) {
      if (error.message.toLowerCase().includes('bucket not found')) {
        throw new Error('O armazenamento de imagens ainda não foi configurado. Execute a migration RF02 no Supabase.')
      }
      throw error
    }

    return supabase.storage.from(BUCKET_IMAGENS_EVENTOS).getPublicUrl(caminho).data.publicUrl
  }

  public async removerImagemPorUrl(url: string): Promise<void> {
    const marcador = `/storage/v1/object/public/${BUCKET_IMAGENS_EVENTOS}/`
    const indice = url.indexOf(marcador)
    if (indice < 0) return

    const caminho = decodeURIComponent(url.slice(indice + marcador.length).split('?')[0])
    if (!caminho) return

    const { error } = await supabase.storage.from(BUCKET_IMAGENS_EVENTOS).remove([caminho])
    if (error) throw error
  }
}

export const eventoService = new EventoService()