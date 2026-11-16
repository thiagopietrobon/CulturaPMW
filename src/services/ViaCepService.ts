export interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function consultarCep(cep: string): Promise<ViaCepResponse | null> {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return null

  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
  if (!response.ok) throw new Error('Falha ao consultar serviço de CEP.')

  const data: ViaCepResponse = await response.json()
  if (data.erro) return null

  return data
}