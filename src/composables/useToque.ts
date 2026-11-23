/**
 * Animações de toque do CulturaPMW.
 *
 * Ao tocar ou clicar em botões, links de navegação e cards:
 *  1. O elemento "afunda" levemente e volta com efeito de mola.
 *  2. Uma onda (ripple) se espalha a partir do ponto tocado.
 *
 * Usa a Web Animations API na propriedade `scale` (independente de
 * `transform`), então não interfere nos efeitos de hover já existentes.
 * Respeita "reduzir movimento" do sistema.
 */

/** Elementos que recebem o efeito. Adicione `.cp-toque` em qualquer outro. */
const SELETOR_TOQUE = [
  'button:not(:disabled)',
  '[role="button"]',
  'summary',
  '.cp-toque',
  // Área pública
  '.header-button',
  '.header-account-link',
  '.nav-link',
  '.evento-card',
  '.voltar-link',
  '.btn-mapa',
  '.btn-externo',
  '.link-voltar',
  '.opcao-filtro',
  // Área do produtor
  '.produtor-sidebar-link',
  '.produtor-sidebar-back',
  '.produtor-btn-primary',
  '.produtor-btn-secondary',
  '.produtor-btn-danger',
  '.produtor-primary-cta',
  '.evento-btn-secondary',
  // Admin
  '.admin-nav-link',
  '.admin-back-public',
  '.admin-quick-card',
  '.admin-stat-card a'
].join(',')

/** Elementos grandes afundam menos que botões pequenos. */
const SELETOR_CARD = '.evento-card, .admin-quick-card'

/** Onde a onda não aparece (só o efeito de pressionar). */
const SEM_ONDA = 'summary, .opcao-filtro, .nav-link, .admin-stat-card a'

const pressionados = new Map<HTMLElement, Animation | null>()

function prefereMenosMovimento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function suportaScale(el: HTMLElement): boolean {
  return typeof el.animate === 'function' && 'scale' in el.style
}

function pressionar(el: HTMLElement) {
  if (!suportaScale(el)) return
  const fator = el.matches(SELETOR_CARD) ? 0.985 : 0.95
  pressionados.get(el)?.cancel()
  const animacao = el.animate(
    [{ scale: '1' }, { scale: String(fator) }],
    { duration: 140, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' }
  )
  pressionados.set(el, animacao)
}

function soltar(el: HTMLElement) {
  if (!pressionados.has(el)) return
  const anterior = pressionados.get(el)
  pressionados.delete(el)
  if (!suportaScale(el)) return
  const atual = anterior ? String(getComputedStyle(el).scale || '1') : '1'
  anterior?.cancel()
  // Volta com "mola": passa um pouco do tamanho original e assenta.
  el.animate(
    [{ scale: atual === 'none' ? '1' : atual }, { scale: '1.02', offset: 0.55 }, { scale: '1' }],
    { duration: 420, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
  )
}

function criarOnda(el: HTMLElement, evento: PointerEvent) {
  if (el.matches(SEM_ONDA)) return
  const rect = el.getBoundingClientRect()
  if (rect.width < 24 || rect.height < 20) return

  // Elementos com position: static precisam ser referência para a onda.
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative'

  const camada = document.createElement('span')
  camada.className = 'cp-onda-camada'
  camada.setAttribute('aria-hidden', 'true')

  const onda = document.createElement('span')
  onda.className = 'cp-onda'
  const x = evento.clientX - rect.left
  const y = evento.clientY - rect.top
  const raio = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y))
  onda.style.left = `${x - raio}px`
  onda.style.top = `${y - raio}px`
  onda.style.width = onda.style.height = `${raio * 2}px`

  camada.appendChild(onda)
  el.appendChild(camada)

  const remover = () => {
    onda.classList.add('is-saindo')
    window.setTimeout(() => camada.remove(), 450)
  }
  // A onda some quando o dedo/mouse solta (ou depois de um tempo máximo).
  const aoSoltar = () => {
    window.removeEventListener('pointerup', aoSoltar)
    window.removeEventListener('pointercancel', aoSoltar)
    window.setTimeout(remover, 180)
  }
  window.addEventListener('pointerup', aoSoltar)
  window.addEventListener('pointercancel', aoSoltar)
  window.setTimeout(remover, 1500)
}

function aoPressionar(evento: PointerEvent) {
  if (evento.button !== 0 && evento.pointerType === 'mouse') return
  if (prefereMenosMovimento()) return
  const alvo = (evento.target as Element | null)?.closest?.(SELETOR_TOQUE) as HTMLElement | null
  if (!alvo || alvo.closest('[aria-disabled="true"]')) return

  pressionar(alvo)
  criarOnda(alvo, evento)

  const fim = () => {
    soltar(alvo)
    window.removeEventListener('pointerup', fim)
    window.removeEventListener('pointercancel', fim)
    alvo.removeEventListener('pointerleave', fim)
  }
  window.addEventListener('pointerup', fim)
  window.addEventListener('pointercancel', fim)
  alvo.addEventListener('pointerleave', fim)
}

let instalado = false

export function instalarEfeitoToque() {
  if (instalado || typeof window === 'undefined') return
  instalado = true
  document.addEventListener('pointerdown', aoPressionar, { passive: true })
}
