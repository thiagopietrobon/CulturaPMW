import { Categoria } from './Categoria'
import { Endereco } from './Endereco'
import { LinkExterno } from './LinkExterno'
import { Produtor } from './Produtor'

export type SituacaoEvento = 'ATIVO' | 'CONCLUIDO' | 'OCULTO'

export interface EventoProps {
  id: string
  titulo: string
  descricao: string
  imagemUrl: string | null
  dataInicio: string | Date
  dataFim: string | Date
  gratuito: boolean
  valorIngresso: number
  situacao: SituacaoEvento
  categoria: Categoria
  endereco: Endereco
  produtor: Produtor
  linksExternos?: LinkExterno[]
}

export class Evento {
  public readonly id: string
  public titulo: string
  public descricao: string
  public imagemUrl: string | null
  public dataInicio: Date
  public dataFim: Date
  public gratuito: boolean
  public valorIngresso: number
  public situacao: SituacaoEvento
  public categoria: Categoria
  public endereco: Endereco
  public produtor: Produtor
  public linksExternos: LinkExterno[]

  constructor(props: EventoProps) {
    this.id = props.id
    this.titulo = props.titulo
    this.descricao = props.descricao
    this.imagemUrl = props.imagemUrl
    this.dataInicio = new Date(props.dataInicio)
    this.dataFim = new Date(props.dataFim)
    this.gratuito = props.gratuito
    this.valorIngresso = Number(props.valorIngresso ?? 0)
    this.situacao = props.situacao
    this.categoria = props.categoria
    this.endereco = props.endereco
    this.produtor = props.produtor
    this.linksExternos = props.linksExternos ?? []

    this.concluirAutomaticamente()
  }

  public concluirAutomaticamente(): void {
    if (this.situacao === 'ATIVO' && new Date() >= this.dataFim) {
      this.situacao = 'CONCLUIDO'
    }
  }

  public removerAposEncerramento(): boolean {
    const limite24h = new Date(this.dataFim.getTime() + 24 * 60 * 60 * 1000)
    return new Date() > limite24h
  }

  public estaVisivel(): boolean {
    if (this.situacao === 'OCULTO') return false
    if (this.removerAposEncerramento()) return false
    if (!this.produtor.podePublicar()) return false
    return true
  }

  public formatarDataInicio(): string {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(this.dataInicio)
  }

  public formatarValor(): string {
    if (this.gratuito) return 'Gratuito'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.valorIngresso)
  }
}