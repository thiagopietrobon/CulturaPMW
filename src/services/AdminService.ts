import { supabase } from './supabase'

export type StatusProdutorAdmin = 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REPROVADO' | 'SUSPENSO'
export type SituacaoEventoAdmin = 'ATIVO' | 'CONCLUIDO' | 'OCULTO'
export type TipoLinkAdmin = 'INGRESSO' | 'DIVULGACAO' | 'CONTATO' | 'OUTRO'

export interface ProdutorAdmin {
  id: string
  nome: string
  email: string
  cpf_cnpj: string
  telefone: string
  descricao: string | null
  status: StatusProdutorAdmin
  suspenso_ate: string | null
  created_at: string | null
  updated_at: string | null
}

export interface CategoriaAdmin {
  id: number
  nome: string
  created_at?: string | null
}

export interface LinkEventoAdmin {
  id?: string
  tipo: TipoLinkAdmin
  url: string
}

export interface LocalizacaoEventoAdmin {
  id?: string
  evento_id?: string
  regiao_id: number
  cep: string | null
  logradouro: string
  numero: string | null
  complemento: string | null
  bairro: string
  cidade: string
  uf: string
  regiao?: { id: number; nome: string } | null
}

export interface EventoAdmin {
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
  situacao: SituacaoEventoAdmin
  created_at: string | null
  updated_at: string | null
  categoria: { id: number; nome: string } | null
  produtor: {
    id: string
    telefone: string
    descricao: string | null
    status: StatusProdutorAdmin
    profile: { nome: string; email: string } | null
  } | null
  localizacao: LocalizacaoEventoAdmin | null
  links: LinkEventoAdmin[]
}

export interface DadosEdicaoEventoAdmin {
  titulo: string
  descricao: string
  imagem_url: string | null
  categoria_id: number
  data_inicio: string
  data_fim: string
  gratuito: boolean
  valor_ingresso: number
  situacao: SituacaoEventoAdmin
  localizacao: LocalizacaoEventoAdmin
  links: LinkEventoAdmin[]
}

function extrairRelacao<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null
  return valor ?? null
}

export class AdminService {
  public async obterResumo() {
    const [produtores, pendentes, eventos, categorias] = await Promise.all([
      supabase.from('produtores').select('id', { count: 'exact', head: true }),
      supabase.from('produtores').select('id', { count: 'exact', head: true }).eq('status', 'AGUARDANDO_APROVACAO'),
      supabase.from('eventos').select('id', { count: 'exact', head: true }),
      supabase.from('categorias').select('id', { count: 'exact', head: true })
    ])

    const erro = produtores.error ?? pendentes.error ?? eventos.error ?? categorias.error
    if (erro) throw erro

    return {
      totalProdutores: produtores.count ?? 0,
      produtoresPendentes: pendentes.count ?? 0,
      totalEventos: eventos.count ?? 0,
      totalCategorias: categorias.count ?? 0
    }
  }

  public async listarProdutores(status?: StatusProdutorAdmin | 'TODOS'): Promise<ProdutorAdmin[]> {
    const { error: regularizacaoError } = await supabase.rpc('admin_regularizar_suspensoes_expiradas')
    if (regularizacaoError) throw regularizacaoError

    let query = supabase
      .from('produtores')
      .select(`
        id, cpf_cnpj, telefone, descricao, status, suspenso_ate, updated_at,
        profile:profiles!produtores_id_fkey ( nome, email, created_at )
      `)
      .order('updated_at', { ascending: false })

    if (status && status !== 'TODOS') query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    return (data ?? []).map((item: any) => {
      const profile = extrairRelacao(item.profile)
      return {
        id: item.id,
        nome: profile?.nome ?? 'Produtor sem nome',
        email: profile?.email ?? 'E-mail não disponível',
        cpf_cnpj: item.cpf_cnpj,
        telefone: item.telefone,
        descricao: item.descricao,
        status: item.status,
        suspenso_ate: item.suspenso_ate,
        created_at: profile?.created_at ?? null,
        updated_at: item.updated_at
      } as ProdutorAdmin
    })
  }

  public async aprovarProdutor(id: string): Promise<void> {
    const { error } = await supabase
      .from('produtores')
      .update({ status: 'APROVADO', suspenso_ate: null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  public async reprovarProdutor(id: string): Promise<void> {
    const { error } = await supabase
      .from('produtores')
      .update({ status: 'REPROVADO', suspenso_ate: null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  public async suspenderProdutor(id: string, ate: string): Promise<void> {
    const dataSuspensao = new Date(ate)
    if (Number.isNaN(dataSuspensao.getTime()) || dataSuspensao <= new Date()) {
      throw new Error('Informe uma data futura para o fim da suspensão.')
    }

    const { error } = await supabase
      .from('produtores')
      .update({ status: 'SUSPENSO', suspenso_ate: dataSuspensao.toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  public async reativarProdutor(id: string): Promise<void> {
    const { error } = await supabase
      .from('produtores')
      .update({ status: 'APROVADO', suspenso_ate: null, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  }

  public async excluirProdutor(id: string): Promise<void> {
    const { error } = await supabase.rpc('admin_excluir_produtor', { p_produtor_id: id })
    if (error) throw error
  }

  public async listarCategorias(): Promise<CategoriaAdmin[]> {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nome, created_at')
      .order('nome', { ascending: true })
    if (error) throw error
    return (data ?? []) as CategoriaAdmin[]
  }

  public async listarRegioes(): Promise<Array<{ id: number; nome: string }>> {
    const { data, error } = await supabase
      .from('regioes')
      .select('id, nome')
      .order('nome', { ascending: true })
    if (error) throw error
    return (data ?? []) as Array<{ id: number; nome: string }>
  }

  public async criarCategoria(nome: string): Promise<void> {
    const { error } = await supabase.from('categorias').insert({ nome: nome.trim() })
    if (error) throw error
  }

  public async editarCategoria(id: number, nome: string): Promise<void> {
    const { error } = await supabase.from('categorias').update({ nome: nome.trim() }).eq('id', id)
    if (error) throw error
  }

  public async excluirCategoria(id: number): Promise<void> {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (error) throw error
  }

  public async listarEventos(): Promise<EventoAdmin[]> {
    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *,
        categoria:categorias!eventos_categoria_id_fkey ( id, nome ),
        produtor:produtores!eventos_produtor_id_fkey (
          id, telefone, descricao, status,
          profile:profiles!produtores_id_fkey ( nome, email )
        ),
        localizacao:localizacoes!localizacoes_evento_id_fkey (
          id, evento_id, regiao_id, cep, logradouro, numero, complemento, bairro, cidade, uf,
          regiao:regioes!localizacoes_regiao_id_fkey ( id, nome )
        ),
        links:links_externos!links_externos_evento_id_fkey ( id, tipo, url )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map((item: any) => {
      const produtor = extrairRelacao(item.produtor)
      if (produtor) produtor.profile = extrairRelacao(produtor.profile)
      const localizacao = extrairRelacao(item.localizacao)
      if (localizacao) localizacao.regiao = extrairRelacao(localizacao.regiao)
      const situacaoEfetiva: SituacaoEventoAdmin =
        item.situacao === 'ATIVO' && new Date(item.data_fim) <= new Date()
          ? 'CONCLUIDO'
          : item.situacao

      return {
        ...item,
        situacao: situacaoEfetiva,
        categoria: extrairRelacao(item.categoria),
        produtor,
        localizacao,
        links: item.links ?? []
      } as EventoAdmin
    })
  }

  public async atualizarEvento(id: string, dados: DadosEdicaoEventoAdmin): Promise<void> {
    const { localizacao, links, ...evento } = dados

    const { error: eventoError } = await supabase
      .from('eventos')
      .update({ ...evento, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (eventoError) throw eventoError

    const { error: localizacaoError } = await supabase
      .from('localizacoes')
      .upsert({ ...localizacao, evento_id: id }, { onConflict: 'evento_id' })
    if (localizacaoError) throw localizacaoError

    const { error: excluirLinksError } = await supabase
      .from('links_externos')
      .delete()
      .eq('evento_id', id)
    if (excluirLinksError) throw excluirLinksError

    if (links.length > 0) {
      const { error: linksError } = await supabase
        .from('links_externos')
        .insert(links.map(({ tipo, url }) => ({ evento_id: id, tipo, url })))
      if (linksError) throw linksError
    }
  }

  public async excluirEvento(id: string): Promise<void> {
    const { error: linksError } = await supabase.from('links_externos').delete().eq('evento_id', id)
    if (linksError) throw linksError

    const { error: localizacaoError } = await supabase.from('localizacoes').delete().eq('evento_id', id)
    if (localizacaoError) throw localizacaoError

    const { error } = await supabase.from('eventos').delete().eq('id', id)
    if (error) throw error
  }
}

export const adminService = new AdminService()
