export type TipoLink = 'INGRESSO' | 'DIVULGACAO' | 'CONTATO' | 'OUTRO'

export class LinkExterno {
  public readonly id?: string
  public tipo: TipoLink
  public url: string

  constructor(tipo: TipoLink, url: string, id?: string) {
    this.id = id
    this.tipo = tipo
    this.url = url
  }

  public getRotulo(): string {
    const rotulos: Record<TipoLink, string> = {
      INGRESSO: 'Comprar Ingressos',
      DIVULGACAO: 'Página Oficial / Divulgação',
      CONTATO: 'Contato do Organizador',
      OUTRO: 'Mais Informações'
    }
    return rotulos[this.tipo]
  }
}