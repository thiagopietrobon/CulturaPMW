import { Endereco } from '../models/Endereco'
import { Regiao } from '../models/Regiao'

export interface ServicoCEP {
  consultarEndereco(cep: string): Promise<Endereco | null>
}

export class ViaCepService implements ServicoCEP {
  public async consultarEndereco(cep: string): Promise<Endereco | null> {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return null

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    if (!response.ok) {
      throw new Error('Falha ao consultar serviço externo de CEP.')
    }

    const data = await response.json()
    if (data.erro) return null

    return new Endereco({
      cep: data.cep,
      logradouro: data.logradouro ?? '',
      complemento: data.complemento ?? '',
      bairro: data.bairro ?? '',
      cidade: data.localidade ?? 'Palmas',
      uf: data.uf ?? 'TO',
      regiao: new Regiao(0, '')
    })
  }
}