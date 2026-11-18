import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface PerfilAutenticado {
  id: string
  nome: string
  email: string
  role: string
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

  public async administradorAtual(): Promise<PerfilAutenticado | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    if (!data.session?.user) return null

    const perfil = await this.buscarPerfil(data.session.user)
    return perfil?.role === 'admin' ? perfil : null
  }

  public async sair(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}

export const authService = new AuthService()
