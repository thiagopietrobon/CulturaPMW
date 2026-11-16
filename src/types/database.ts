export type UserRole = 'produtor' | 'admin'
export type StatusProdutor = 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REPROVADO' | 'SUSPENSO'
export type SituacaoEvento = 'ATIVO' | 'CONCLUIDO' | 'OCULTO'
export type TipoLink = 'INGRESSO' | 'DIVULGACAO' | 'CONTATO' | 'OUTRO'

export interface Categoria {
  id: number
  nome: string
}

export interface Regiao {
  id: number
  nome: string
}

export interface LinkExterno {
  id?: string
  evento_id?: string
  tipo: TipoLink
  url: string
}

export interface Localizacao {
  id?: string
  evento_id?: string
  regiao_id: number
  cep?: string
  logradouro: string
  numero?: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
}

export interface EventoPublico {
  id: string
  produtor_id: string
  categoria_id: number
  categoria_nome: string
  regiao_id: number
  regiao_nome: string
  titulo: string
  descricao: string
  imagem_url: string | null
  data_inicio: string
  data_fim: string
  gratuito: boolean
  valor_ingresso: number
  situacao_atual: SituacaoEvento
  cep: string | null
  logradouro: string
  numero: string | null
  complemento: string | null
  bairro: string
  cidade: string
  uf: string
  produtor_nome: string
  produtor_descricao: string | null
  produtor_telefone: string
}