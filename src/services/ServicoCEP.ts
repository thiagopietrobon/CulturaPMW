import { Endereco } from '../models/Endereco'
import { Regiao } from '../models/Regiao'

export interface ServicoCEP {
  consultarEndereco(cep: string): Promise<Endereco | null>
}

export class ViaCepService implements ServicoCEP {
  public async consultarEndereco(cep: string): Promise<Endereco | null> {
    const cepLimpo = cep.replace(/\D/g, '')

    if (cepLimpo.length !== 8) {
      throw new Error('Informe um CEP com 8 números.')
    }

    let response: Response
    try {
      response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000)
      })
    } catch {
      throw new Error('Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.')
    }

    if (!response.ok) {
      throw new Error('O serviço de CEP está indisponível. Você pode preencher o endereço manualmente.')
    }

    let data: {
      cep?: string
      logradouro?: string
      complemento?: string
      bairro?: string
      localidade?: string
      uf?: string
      erro?: boolean
    }

    try {
      data = await response.json()
    } catch {
      throw new Error('O serviço de CEP retornou uma resposta inválida. Preencha o endereço manualmente.')
    }

    if (data.erro) return null

    return new Endereco({
      cep: data.cep ?? cepLimpo,
      logradouro: data.logradouro ?? '',
      complemento: data.complemento ?? '',
      bairro: data.bairro ?? '',
      cidade: data.localidade ?? '',
      uf: data.uf ?? '',
      // A região de Palmas é selecionada/confirmada separadamente pelo produtor.
      regiao: new Regiao(0, '')
    })
  }
}

export const servicoCEP = new ViaCepService()
