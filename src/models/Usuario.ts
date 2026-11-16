export type UserRole = 'produtor' | 'admin'

export abstract class Usuario {
  public readonly id: string
  public nome: string
  public email: string
  public readonly role: UserRole

  constructor(id: string, nome: string, email: string, role: UserRole) {
    this.id = id
    this.nome = nome
    this.email = email
    this.role = role
  }

  public abstract getTipoPerfil(): string
}