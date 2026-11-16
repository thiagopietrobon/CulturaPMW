import { Usuario } from './Usuario'

export class Administrador extends Usuario {
  constructor(id: string, nome: string, email: string) {
    super(id, nome, email, 'admin')
  }

  public getTipoPerfil(): string {
    return 'Administrador'
  }
}