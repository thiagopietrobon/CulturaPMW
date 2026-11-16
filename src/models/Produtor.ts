import { Usuario } from './Usuario'

export type StatusProdutor = 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REPROVADO' | 'SUSPENSO'

export interface ProdutorProps {
  id: string
  nome: string
  email: string
  cpfCnpj?: string
  telefone: string
  descricao?: string | null
  status?: StatusProdutor
  suspensoAte?: string | null
}

export class Produtor extends Usuario {
  public cpfCnpj: string
  public telefone: string
  public descricao: string
  public status: StatusProdutor
  public suspensoAte: Date | null

  constructor(props: ProdutorProps) {
    super(props.id, props.nome, props.email, 'produtor')
    this.cpfCnpj = props.cpfCnpj ?? ''
    this.telefone = props.telefone
    this.descricao = props.descricao ?? ''
    this.status = props.status ?? 'APROVADO'
    this.suspensoAte = props.suspensoAte ? new Date(props.suspensoAte) : null
  }

  public getTipoPerfil(): string {
    return 'Produtor de Eventos'
  }

  public estaSuspenso(): boolean {
    if (this.status === 'SUSPENSO') return true
    if (this.suspensoAte && this.suspensoAte > new Date()) return true
    return false
  }

  public podePublicar(): boolean {
    return this.status === 'APROVADO' && !this.estaSuspenso()
  }
}