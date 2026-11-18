import { supabase } from './supabase'
import type { Endereco } from '../models/Endereco'
import { Regiao } from '../models/Regiao'

export interface DadosLocalizacaoEvento {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  regiao_id: number | null
}

export interface LocalizacaoEventoSalva extends DadosLocalizacaoEvento {
  id: string
  evento_id: string
}

export function criarLocalizacaoVazia(): DadosLocalizacaoEvento {
  return {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: 'Palmas',
    uf: 'TO',
    regiao_id: null
  }
}

function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export class LocalizacaoService {
  public async listarRegioes(): Promise<Regiao[]> {
    const { data, error } = await supabase
      .from('regioes')
      .select('id, nome')
      .order('nome', { ascending: true })

    if (error) throw error
    return (data ?? []).map((item) => new Regiao(item.id, item.nome))
  }

  public identificarRegiao(
    endereco: Pick<Endereco, 'logradouro' | 'bairro' | 'cidade' | 'uf'>,
    regioes: Regiao[]
  ): Regiao | null {
    const texto = normalizarTexto(`${endereco.bairro} ${endereco.logradouro}`)
    const regras: Array<{ regiao: RegExp; termos: RegExp }> = [
      { regiao: /^taquarucu$/i, termos: /taquarucu/ },
      { regiao: /^taquaralto$/i, termos: /taquaralto/ },
      { regiao: /^jardim aureny i - iv$/i, termos: /aureny\s*(i|ii|iii|iv|1|2|3|4)\b|jardim aureny/ },
      { regiao: /^orla da graciosa$/i, termos: /orla da graciosa|graciosa/ },
      { regiao: /^plano diretor norte$/i, termos: /plano diretor norte/ },
      { regiao: /^plano diretor sul$/i, termos: /plano diretor sul/ }
    ]

    for (const regra of regras) {
      if (!regra.termos.test(texto)) continue
      const encontrada = regioes.find((regiao) => regra.regiao.test(normalizarTexto(regiao.nome)))
      if (encontrada) return encontrada
    }

    // Não presume uma região quando o endereço não contém uma referência conhecida.
    // Nesses casos o produtor seleciona manualmente uma das regiões cadastradas.
    return null
  }

  public validarDados(dados: DadosLocalizacaoEvento): string | null {
    if (!dados.logradouro.trim()) return 'Informe o logradouro do evento.'
    if (!dados.bairro.trim()) return 'Informe o bairro do evento.'
    if (!dados.cidade.trim()) return 'Informe a cidade do evento.'
    if (dados.cidade.trim().toLocaleLowerCase('pt-BR') !== 'palmas' || dados.uf.trim().toUpperCase() !== 'TO') {
      return 'O CulturaPMW aceita eventos realizados em Palmas-TO. Confira a cidade e o estado do endereço.'
    }
    if (!dados.regiao_id || !Number.isInteger(dados.regiao_id) || dados.regiao_id <= 0) return 'Selecione a região de Palmas onde o evento será realizado.'

    const cep = dados.cep.replace(/\D/g, '')
    if (cep && cep.length !== 8) return 'O CEP deve conter 8 números.'

    return null
  }

  public async buscarPorEvento(eventoId: string): Promise<DadosLocalizacaoEvento | null> {
    if (!eventoId) throw new Error('Informe o evento para consultar sua localização.')

    const { data, error } = await supabase
      .from('localizacoes')
      .select('cep, logradouro, numero, complemento, bairro, cidade, uf, regiao_id')
      .eq('evento_id', eventoId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      cep: data.cep ?? '',
      logradouro: data.logradouro,
      numero: data.numero ?? '',
      complemento: data.complemento ?? '',
      bairro: data.bairro,
      cidade: data.cidade ?? 'Palmas',
      uf: data.uf ?? 'TO',
      regiao_id: data.regiao_id
    }
  }

  public async salvar(eventoId: string, dados: DadosLocalizacaoEvento): Promise<void> {
    if (!eventoId) throw new Error('Salve o evento antes de associar sua localização.')

    const erroValidacao = this.validarDados(dados)
    if (erroValidacao) throw new Error(erroValidacao)

    const { error } = await supabase
      .from('localizacoes')
      .upsert({
        evento_id: eventoId,
        regiao_id: dados.regiao_id,
        cep: dados.cep.replace(/\D/g, '') || null,
        logradouro: dados.logradouro.trim(),
        numero: dados.numero.trim() || null,
        complemento: dados.complemento.trim() || null,
        bairro: dados.bairro.trim(),
        cidade: 'Palmas',
        uf: 'TO'
      }, { onConflict: 'evento_id' })

    if (error) throw error
  }
}

export const localizacaoService = new LocalizacaoService()
