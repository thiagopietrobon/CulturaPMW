import { nextTick, readonly, ref } from 'vue'

/**
 * Tema claro/escuro do CulturaPMW.
 * - A escolha fica salva no navegador (localStorage).
 * - Sem escolha salva, segue o tema do sistema (Windows, celular...).
 * - O atributo <html data-theme="claro|escuro"> é o que o CSS usa.
 * O index.html aplica o tema antes do Vue carregar, evitando "piscar" branco.
 */
export type Tema = 'claro' | 'escuro'

const CHAVE = 'culturapmw:tema'
const raiz = document.documentElement

function temaSalvo(): Tema | null {
  try {
    const valor = window.localStorage.getItem(CHAVE)
    return valor === 'claro' || valor === 'escuro' ? valor : null
  } catch {
    return null
  }
}

function salvar(valor: Tema) {
  try {
    window.localStorage.setItem(CHAVE, valor)
  } catch {
    // Navegação privada pode bloquear o armazenamento; o tema vale só nesta visita.
  }
}

const consultaSistema = window.matchMedia?.('(prefers-color-scheme: dark)')

function temaDoSistema(): Tema {
  return consultaSistema?.matches ? 'escuro' : 'claro'
}

function aplicar(valor: Tema) {
  raiz.dataset.theme = valor
}

const atributoInicial = raiz.dataset.theme
const tema = ref<Tema>(
  atributoInicial === 'claro' || atributoInicial === 'escuro'
    ? atributoInicial
    : temaSalvo() ?? temaDoSistema()
)
aplicar(tema.value)

// Se a pessoa nunca escolheu, acompanha mudanças do sistema em tempo real.
consultaSistema?.addEventListener?.('change', () => {
  if (temaSalvo()) return
  tema.value = temaDoSistema()
  aplicar(tema.value)
})

type DocumentoComTransicao = Document & {
  startViewTransition?: (callback: () => Promise<void> | void) => unknown
}

function prefereMenosMovimento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** Ponto de origem do círculo da animação: o centro do botão clicado. */
function definirOrigem(evento?: Event) {
  const alvo = evento?.currentTarget as HTMLElement | null | undefined
  let x = window.innerWidth / 2
  let y = 0
  if (alvo?.getBoundingClientRect) {
    const r = alvo.getBoundingClientRect()
    x = r.left + r.width / 2
    y = r.top + r.height / 2
  }
  const raio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  raiz.style.setProperty('--tema-x', `${x}px`)
  raiz.style.setProperty('--tema-y', `${y}px`)
  raiz.style.setProperty('--tema-raio', `${raio}px`)
}

async function definir(novo: Tema, evento?: Event) {
  if (novo === tema.value) return
  salvar(novo)

  const doc = document as DocumentoComTransicao
  const trocar = async () => {
    tema.value = novo
    aplicar(novo)
    await nextTick()
  }

  if (prefereMenosMovimento()) {
    await trocar()
    return
  }

  // Navegadores modernos: círculo que se expande a partir do botão.
  if (typeof doc.startViewTransition === 'function') {
    definirOrigem(evento)
    doc.startViewTransition(trocar)
    return
  }

  // Demais navegadores: transição de cores.
  raiz.classList.add('tema-trocando')
  await trocar()
  window.setTimeout(() => raiz.classList.remove('tema-trocando'), 500)
}

function alternar(evento?: Event) {
  return definir(tema.value === 'escuro' ? 'claro' : 'escuro', evento)
}

export function useTema() {
  return {
    tema: readonly(tema),
    alternar,
    definir
  }
}
