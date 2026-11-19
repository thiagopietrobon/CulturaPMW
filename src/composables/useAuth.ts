import { computed, readonly, ref } from 'vue'
import { supabase } from '../services/supabase'
import { authService, type PerfilProdutorAutenticado } from '../services/AuthService'

const perfil = ref<PerfilProdutorAutenticado | null>(null)
const carregando = ref(true)
let inicializado = false
let atualizando: Promise<PerfilProdutorAutenticado | null> | null = null

/** Atualiza o perfil compartilhado. `forcar` ignora uma consulta em andamento
 *  para permitir que a tela de situação consulte novamente o banco após a
 *  administração alterar o status do produtor.
 */
async function atualizarPerfil(forcar = false): Promise<PerfilProdutorAutenticado | null> {
  if (atualizando) {
    if (!forcar) return atualizando
    await atualizando.catch(() => null)
  }

  const requisicao = (async () => {
    const perfilAtualizado = await authService.produtorAtual()
    perfil.value = perfilAtualizado
    return perfilAtualizado
  })()

  atualizando = requisicao
  try {
    return await requisicao
  } finally {
    if (atualizando === requisicao) atualizando = null
    carregando.value = false
  }
}

function inicializar(): void {
  if (inicializado) return
  inicializado = true

  void atualizarPerfil().catch((error) => {
    console.error('[CulturaPMW] Não foi possível carregar o perfil do produtor:', error)
  })

  supabase.auth.onAuthStateChange((_evento, sessao) => {
    if (!sessao) {
      perfil.value = null
      carregando.value = false
      return
    }
    // Evita executar consultas Supabase dentro do callback síncrono do Auth.
    queueMicrotask(() => {
      void atualizarPerfil(true).catch((error) => {
        console.error('[CulturaPMW] Não foi possível atualizar o perfil do produtor:', error)
      })
    })
  })
}

export function useAuth() {
  inicializar()

  return {
    perfil: readonly(perfil),
    carregando: readonly(carregando),
    autenticado: computed(() => perfil.value !== null),
    atualizarPerfil
  }
}
