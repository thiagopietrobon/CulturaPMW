import { Regiao } from './Regiao'

export interface EnderecoProps {
  cep?: string | null
  logradouro: string
  numero?: string | null
  complemento?: string | null
  bairro: string
  cidade?: string
  uf?: string
  regiao: Regiao
}

export class Endereco {
  public cep: string
  public logradouro: string
  public numero: string
  public complemento: string
  public bairro: string
  public cidade: string
  public uf: string
  public regiao: Regiao

  constructor(props: EnderecoProps) {
    this.cep = props.cep ?? ''
    this.logradouro = props.logradouro
    this.numero = props.numero ?? ''
    this.complemento = props.complemento ?? ''
    this.bairro = props.bairro
    this.cidade = props.cidade ?? 'Palmas'
    this.uf = props.uf ?? 'TO'
    this.regiao = props.regiao
  }

  public getEnderecoCompleto(): string {
    const partes = [
      this.logradouro,
      this.numero ? `nº ${this.numero}` : 'S/N',
      this.complemento,
      this.bairro,
      `${this.cidade} - ${this.uf}`
    ].filter(Boolean)

    return partes.join(', ')
  }

  public gerarLinkMapa(provedor: 'google' | 'waze' = 'google'): string {
    const query = encodeURIComponent(`${this.logradouro}, ${this.numero}, ${this.bairro}, ${this.cidade} - ${this.uf}`)
    if (provedor === 'waze') {
      return `https://waze.com/ul?q=${query}&navigate=yes`
    }
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }
}