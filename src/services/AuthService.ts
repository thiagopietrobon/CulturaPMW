import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type StatusProdutor = 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REPROVADO' | 'SUSPENSO'

export interface PerfilAutenticado {
  id: string
  nome: string
  email: string
  role: string
}

export interface PerfilProdutorAutenticado extends PerfilAutenticado {
  role: 'produtor'
  cpf_cnpj: string
  telefone: string
  descricao: string | null
  status: StatusProdutor
  suspenso_ate: string | null
}

export interface DadosCadastroProdutor {
  nome: string
  email: string
  senha: string
  cpfCnpj: string
  telefone: string
  descricao?: string
}

export interface DadosEdicaoPerfilProdutor {
  nome: string
  email: string
  cpfCnpj: string
  telefone: string
  descricao: string
}

export interface ResultadoCadastroProdutor {
  aguardandoConfirmacaoEmail: boolean
}

function normalizarDocumento(valor: string): string {
  return valor.replace(/\D/g, '')
}

function validarCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0
    for (let i = 0; i < base.length; i += 1) soma += Number(base[i]) * (pesoInicial - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return calcularDigito(cpf.slice(0, 9), 10) === Number(cpf[9])
    && calcularDigito(cpf.slice(0, 10), 11) === Number(cpf[10])
}

function validarCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const calcularDigito = (base: string, pesos: number[]): number => {
    const soma = base.split('').reduce((total, numero, indice) => total + Number(numero) * pesos[indice], 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const primeiro = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const segundo = calcularDigito(cnpj.slice(0, 12) + primeiro, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return primeiro === Number(cnpj[12]) && segundo === Number(cnpj[13])
}

export function validarCpfCnpj(valor: string): boolean {
  const documento = normalizarDocumento(valor)
  return documento.length === 11 ? validarCpf(documento) : documento.length === 14 && validarCnpj(documento)
}

function validarTelefone(valor: string): boolean {
  const telefone = normalizarDocumento(valor)
  return telefone.length === 10 || telefone.length === 11
}

export class AuthService {
  private async buscarPerfil(user: User): Promise<PerfilAutenticado | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, email, role')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error
    return data as PerfilAutenticado | null
  }

  public async entrarComoAdministrador(email: string, senha: string): Promise<PerfilAutenticado> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw error

    try {
      const perfil = await this.buscarPerfil(data.user)
      if (!perfil || perfil.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('Esta conta não possui permissão de administrador.')
      }
      return perfil
    } catch (error) {
      await supabase.auth.signOut()
      throw error
    }
  }

  public async cadastrarProdutor(dados: DadosCadastroProdutor): Promise<ResultadoCadastroProdutor> {
    const documento = normalizarDocumento(dados.cpfCnpj)
    const telefone = normalizarDocumento(dados.telefone)

    if (!dados.nome.trim()) throw new Error('Informe o nome do produtor ou da empresa.')
    if (!validarCpfCnpj(documento)) throw new Error('Informe um CPF ou CNPJ válido.')
    if (!validarTelefone(telefone)) throw new Error('Informe um telefone com DDD válido.')
    if (dados.senha.length < 8) throw new Error('A senha deve possuir pelo menos 8 caracteres.')

    const { data, error } = await supabase.auth.signUp({
      email: dados.email.trim().toLowerCase(),
      password: dados.senha,
      options: {
        data: {
          tipo_conta: 'produtor',
          nome: dados.nome.trim(),
          cpf_cnpj: documento,
          telefone,
          descricao: dados.descricao?.trim() || null
        },
        emailRedirectTo: `${window.location.origin}/produtor/login`
      }
    })

    if (error) {
      const mensagem = error.message.toLowerCase()
      if (mensagem.includes('duplicate key') || mensagem.includes('unique constraint') || mensagem.includes('cpf/cnpj já está cadastrado')) {
        throw new Error('Este CPF/CNPJ já está cadastrado como produtor.')
      }
      if (mensagem.includes('user already registered')) {
        throw new Error('Já existe uma conta cadastrada com este e-mail.')
      }
      if (
        mensagem.includes('database error saving new user') ||
        mensagem.includes('permission denied') ||
        mensagem.includes('does not exist') ||
        mensagem.includes('schema cache')
      ) {
        // O Supabase Auth/PostgREST pode retornar detalhes internos do banco.
        // Eles ficam no console para diagnóstico, nunca como validação ao produtor.
        console.error('[CulturaPMW] Falha interna ao concluir o cadastro do produtor:', error)
        throw new Error('Não foi possível concluir seu cadastro agora. Confira os dados e tente novamente. Se o problema continuar, entre em contato com a equipe do CulturaPMW.')
      }
      throw error
    }

    if (!data.user) throw new Error('Não foi possível criar a solicitação de cadastro.')

    return { aguardandoConfirmacaoEmail: !data.session }
  }

  public async entrarComoProdutor(email: string, senha: string): Promise<PerfilProdutorAutenticado> {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha })
    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        throw new Error('E-mail ou senha incorretos.')
      }
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Confirme seu endereço de e-mail antes de entrar.')
      }
      throw error
    }

    try {
      const produtor = await this.buscarProdutorAutenticado(data.user)
      if (!produtor) throw new Error('Esta conta não possui um cadastro de produtor válido.')
      return produtor
    } catch (error) {
      await supabase.auth.signOut()
      throw error
    }
  }

  private async buscarProdutorAutenticado(user: User): Promise<PerfilProdutorAutenticado | null> {
    const perfil = await this.buscarPerfil(user)
    if (!perfil || perfil.role !== 'produtor') return null

    const { data, error } = await supabase
      .from('produtores')
      .select('cpf_cnpj, telefone, descricao, status, suspenso_ate')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return { ...perfil, role: 'produtor', ...data } as PerfilProdutorAutenticado
  }

  public async produtorAtual(): Promise<PerfilProdutorAutenticado | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!data.session?.user) return null
    return this.buscarProdutorAutenticado(data.session.user)
  }

  public async administradorAtual(): Promise<PerfilAutenticado | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!data.session?.user) return null

    const perfil = await this.buscarPerfil(data.session.user)
    return perfil?.role === 'admin' ? perfil : null
  }

  public async atualizarPerfilProdutor(dados: DadosEdicaoPerfilProdutor): Promise<{ emailPendente: boolean }> {
    const produtorAtual = await this.produtorAtual()
    if (!produtorAtual) throw new Error('Não foi possível localizar o cadastro do produtor.')
    if (produtorAtual.status !== 'APROVADO') {
      throw new Error('A edição dos dados está disponível somente para produtores aprovados.')
    }

    const documento = normalizarDocumento(dados.cpfCnpj)
    const telefone = normalizarDocumento(dados.telefone)
    if (!dados.nome.trim()) throw new Error('O nome é obrigatório.')
    if (!validarCpfCnpj(documento)) throw new Error('Informe um CPF ou CNPJ válido.')
    if (!validarTelefone(telefone)) throw new Error('Informe um telefone com DDD válido.')

    const { error: perfilError } = await supabase
      .from('profiles')
      .update({ nome: dados.nome.trim() })
      .eq('id', produtorAtual.id)
    if (perfilError) throw perfilError

    const { error: produtorError } = await supabase
      .from('produtores')
      .update({
        cpf_cnpj: documento,
        telefone,
        descricao: dados.descricao.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', produtorAtual.id)
    if (produtorError) throw produtorError

    const emailNovo = dados.email.trim().toLowerCase()
    if (emailNovo && emailNovo !== produtorAtual.email.toLowerCase()) {
      const { error: emailError } = await supabase.auth.updateUser(
        { email: emailNovo },
        { emailRedirectTo: `${window.location.origin}/produtor/perfil` }
      )
      if (emailError) throw emailError
      return { emailPendente: true }
    }

    return { emailPendente: false }
  }

  public async excluirPropriaConta(): Promise<void> {
    const { data, error: sessaoError } = await supabase.auth.getSession()
    if (sessaoError) throw sessaoError
    if (!data.session?.user) throw new Error('Sua sessão expirou. Entre novamente para excluir a conta.')

    const { error } = await supabase.rpc('produtor_excluir_propria_conta')
    if (error) throw error

    // A exclusão no banco é definitiva; limpar a sessão local encerra o acesso no navegador.
    await supabase.auth.signOut({ scope: 'local' })
  }

  public async enviarRecuperacaoSenha(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/produtor/redefinir-senha`
    })
    if (error) throw error
  }

  public async atualizarSenha(novaSenha: string): Promise<void> {
    if (novaSenha.length < 8) throw new Error('A nova senha deve possuir pelo menos 8 caracteres.')
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) throw error
  }

  public async sair(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}

export const authService = new AuthService()
