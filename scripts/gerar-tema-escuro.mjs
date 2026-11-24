#!/usr/bin/env node
/**
 * CulturaPMW — Gerador do tema escuro
 * -----------------------------------
 * Lê todo o CSS do projeto (arquivos em src/assets/styles e blocos
 * <style scoped> dos .vue) e gera as regras equivalentes para o modo escuro,
 * ativadas por <html data-theme="escuro">.
 *
 * Como funciona:
 *  - Para cada regra que tenha propriedades de cor (color, background, border,
 *    box-shadow...), cria a mesma regra prefixada por html[data-theme='escuro'].
 *  - Fundos claros viram superfícies azul-marinho; textos escuros viram claros;
 *    bordas claras viram bordas escuras; sombras ficam mais profundas.
 *    Cores de marca (azuis médios, gradientes) são preservadas.
 *  - Toda regra recebe o mesmo prefixo, então a ordem de prioridade (cascata)
 *    entre as regras originais é mantida.
 *
 * Saídas:
 *  - src/assets/styles/tema-escuro.gerado.css  (para os CSS globais)
 *  - um trecho marcado no fim de cada <style scoped> dos .vue
 *
 * Uso:  npm run tema:escuro     (também roda sozinho antes de dev/build)
 * Ajustes finos que o gerador não cobre ficam em tema-escuro.css (manual).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const SRC = join(RAIZ, 'src')
const PASTA_ESTILOS = join(SRC, 'assets', 'styles')
const SAIDA_GLOBAL = join(PASTA_ESTILOS, 'tema-escuro.gerado.css')

const PREFIXO = "html[data-theme='escuro']"
const INICIO_VUE = '/* ===== TEMA ESCURO (gerado por scripts/gerar-tema-escuro.mjs — não editar este trecho) ===== */'
const FIM_VUE = '/* ===== FIM DO TEMA ESCURO GERADO ===== */'

// Arquivos globais que não devem ser processados
const IGNORAR_GLOBAIS = new Set(['tema-escuro.css', 'tema-escuro.gerado.css', 'variables.css'])

// Seletores que já são escuros nos dois temas (barra lateral, rodapé, logos...)
const SELETORES_FIXOS = [/sidebar(?!-toggle)/, /\.footer(?![\w-])/, /logo(?!ut)/, /brand-mark/, /\.hero(?![\w-])/]

/* =====================================================================
   1. LEITURA DE ARQUIVOS
   ===================================================================== */
function listar(dir, ext) {
  const out = []
  for (const nome of readdirSync(dir)) {
    const p = join(dir, nome)
    if (statSync(p).isDirectory()) out.push(...listar(p, ext))
    else if (p.endsWith(ext)) out.push(p)
  }
  return out.sort()
}

const RE_ESTILO_VUE = /(<style\b[^>]*\bscoped\b[^>]*>)([\s\S]*?)(<\/style>)/

function cssDoVue(conteudo) {
  const m = conteudo.match(RE_ESTILO_VUE)
  if (!m) return null
  return removerTrechoGerado(m[2])
}

function removerTrechoGerado(css) {
  const i = css.indexOf(INICIO_VUE)
  if (i === -1) return css
  const f = css.indexOf(FIM_VUE, i)
  return css.slice(0, i).replace(/\s+$/, '\n') + (f === -1 ? '' : css.slice(f + FIM_VUE.length))
}

/* =====================================================================
   2. PARSER DE CSS (suficiente para o CSS deste projeto)
   ===================================================================== */
function semComentarios(css) {
  let out = ''
  let i = 0
  let aspas = null
  while (i < css.length) {
    const c = css[i]
    if (aspas) {
      out += c
      if (c === '\\') { out += css[i + 1] ?? ''; i += 2; continue }
      if (c === aspas) aspas = null
      i++
      continue
    }
    if (c === '"' || c === "'") { aspas = c; out += c; i++; continue }
    if (c === '/' && css[i + 1] === '*') {
      const fim = css.indexOf('*/', i + 2)
      i = fim === -1 ? css.length : fim + 2
      continue
    }
    out += c
    i++
  }
  return out
}

/** Procura o próximo caractere de `alvos` fora de aspas e parênteses. */
function proximo(css, i, alvos) {
  let aspas = null
  let parenteses = 0
  for (; i < css.length; i++) {
    const c = css[i]
    if (aspas) {
      if (c === '\\') { i++; continue }
      if (c === aspas) aspas = null
      continue
    }
    if (c === '"' || c === "'") { aspas = c; continue }
    if (c === '(') { parenteses++; continue }
    if (c === ')') { parenteses = Math.max(0, parenteses - 1); continue }
    if (parenteses === 0 && alvos.includes(c)) return i
  }
  return -1
}

function fechamento(css, abre) {
  let nivel = 0
  for (let i = abre; i < css.length; i++) {
    const j = proximo(css, i, '{}')
    if (j === -1) return css.length
    if (css[j] === '{') nivel++
    else { nivel--; if (nivel === 0) return j }
    i = j
  }
  return css.length
}

function dividir(texto, separador) {
  const partes = []
  let inicio = 0
  for (;;) {
    const j = proximo(texto, inicio, separador)
    if (j === -1) { partes.push(texto.slice(inicio)); break }
    partes.push(texto.slice(inicio, j))
    inicio = j + 1
  }
  return partes
}

function analisar(css) {
  const nos = []
  let i = 0
  while (i < css.length) {
    const j = proximo(css, i, '{;}')
    if (j === -1) break
    const preludio = css.slice(i, j).trim()
    if (css[j] === ';' || css[j] === '}') { i = j + 1; continue }
    const f = fechamento(css, j)
    const corpo = css.slice(j + 1, f)
    if (preludio.startsWith('@')) {
      if (/^@(media|supports|container|layer)\b/.test(preludio)) {
        nos.push({ tipo: 'at', preludio, filhos: analisar(corpo) })
      }
      // @keyframes, @font-face etc. são ignorados
    } else if (preludio) {
      const declaracoes = dividir(corpo, ';')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => {
          const k = d.indexOf(':')
          if (k === -1) return null
          let valor = d.slice(k + 1).trim()
          const importante = /!\s*important\s*$/i.test(valor)
          if (importante) valor = valor.replace(/!\s*important\s*$/i, '').trim()
          return { prop: d.slice(0, k).trim().toLowerCase(), valor, importante }
        })
        .filter(Boolean)
      nos.push({ tipo: 'regra', seletor: preludio, declaracoes })
    }
    i = f + 1
  }
  return nos
}

/* =====================================================================
   3. CORES
   ===================================================================== */
const RE_COR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^()]*\)|hsla?\([^()]*\)|\b(?:white|black)\b/g

function lerCor(txt) {
  const t = txt.toLowerCase()
  if (t === 'white') return { r: 255, g: 255, b: 255, a: 1 }
  if (t === 'black') return { r: 0, g: 0, b: 0, a: 1 }
  if (t.startsWith('#')) {
    let h = t.slice(1)
    if (![3, 4, 6, 8].includes(h.length)) return null
    if (h.length <= 4) h = [...h].map((c) => c + c).join('')
    const n = (k) => parseInt(h.slice(k, k + 2), 16)
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 }
  }
  const m = t.match(/^(rgba?|hsla?)\((.*)\)$/)
  if (!m) return null
  const partes = m[2].replace(/\//g, ' / ').split(/[\s,]+/).filter(Boolean)
  const barra = partes.indexOf('/')
  let nums = partes
  let alfa = 1
  if (barra !== -1) { nums = partes.slice(0, barra); alfa = numAlfa(partes[barra + 1]) }
  else if (partes.length === 4) { nums = partes.slice(0, 3); alfa = numAlfa(partes[3]) }
  if (nums.length < 3) return null
  if (m[1].startsWith('rgb')) {
    const v = nums.map((x) => (x.endsWith('%') ? (parseFloat(x) * 255) / 100 : parseFloat(x)))
    return { r: v[0], g: v[1], b: v[2], a: alfa }
  }
  const [r, g, b] = hslParaRgb(parseFloat(nums[0]) / 360, parseFloat(nums[1]) / 100, parseFloat(nums[2]) / 100)
  return { r, g, b, a: alfa }
}

function numAlfa(x) {
  if (x == null) return 1
  return x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x)
}

function rgbParaHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h / 6, s, l]
}

function hslParaRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]
}

function escrever({ r, g, b, a }) {
  const c = (x) => Math.round(Math.max(0, Math.min(255, x)))
  if (a >= 0.999) return '#' + [r, g, b].map((x) => c(x).toString(16).padStart(2, '0')).join('')
  return `rgb(${c(r)} ${c(g)} ${c(b)} / ${Math.round(a * 1000) / 10}%)`
}

const HUE_MARINHO = 216 / 360

/** Superfícies: claro -> azul-marinho. Cores médias e escuras ficam iguais. */
function mapaFundo(cor) {
  const [h, s, l] = rgbParaHsl(cor.r, cor.g, cor.b)
  if (cor.a < 0.5 || l <= 0.7) return cor
  const neutro = s < 0.25
  const nl = 0.115 + (1 - l) * 0.55
  const ns = neutro ? 0.36 : Math.min(s, 0.5)
  const [r, g, b] = hslParaRgb(neutro ? HUE_MARINHO : h, ns, nl)
  return { r, g, b, a: cor.a }
}

/** Texto: escuro -> claro, preservando o matiz. */
function mapaTexto(cor) {
  const [h, s, l] = rgbParaHsl(cor.r, cor.g, cor.b)
  if (l >= 0.66) return cor
  const nl = 0.93 - l * 0.42
  const ns = s < 0.12 ? s : Math.min(s, 0.78)
  const [r, g, b] = hslParaRgb(s < 0.12 ? HUE_MARINHO : h, s < 0.12 ? 0.18 : ns, nl)
  return { r, g, b, a: cor.a }
}

/** Bordas: claro -> linha escura discreta. */
function mapaBorda(cor) {
  const [h, s, l] = rgbParaHsl(cor.r, cor.g, cor.b)
  if (cor.a < 0.3 || l <= 0.7) return cor
  const neutro = s < 0.25
  const nl = 0.2 + (1 - l) * 0.45
  const [r, g, b] = hslParaRgb(neutro ? HUE_MARINHO : h, neutro ? 0.3 : Math.min(s, 0.45), nl)
  return { r, g, b, a: cor.a }
}

/** Sombras: tons escuros viram preto mais denso; brilhos coloridos ficam. */
function mapaSombra(cor) {
  const [, , l] = rgbParaHsl(cor.r, cor.g, cor.b)
  if (l > 0.35) return cor
  return { r: 0, g: 0, b: 0, a: Math.min(cor.a * 2.2, 0.55) }
}

function trocarCores(valor, mapa) {
  return valor.replace(RE_COR, (txt) => {
    const cor = lerCor(txt)
    return cor ? escrever(mapa(cor)) : txt
  })
}

/* =====================================================================
   4. VARIÁVEIS CSS (resolvidas para poder mapear cores usadas via var())
   ===================================================================== */
const variaveis = new Map()

function coletarVariaveis(nos) {
  for (const no of nos) {
    if (no.tipo === 'at') coletarVariaveis(no.filhos)
    else if (/^:root\b/.test(no.seletor.trim())) {
      for (const d of no.declaracoes) if (d.prop.startsWith('--')) variaveis.set(d.prop, d.valor)
    }
  }
}

function resolverVariaveis(valor, profundidade = 0) {
  if (profundidade > 5) return valor
  return valor.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (todo, nome, reserva) => {
    if (variaveis.has(nome)) return resolverVariaveis(variaveis.get(nome), profundidade + 1)
    return reserva ?? todo
  })
}

/* =====================================================================
   5. DECLARAÇÕES -> VERSÃO ESCURA
   ===================================================================== */
const PROPS_TEXTO = new Set(['color', 'caret-color', '-webkit-text-fill-color', 'text-decoration-color', 'fill', 'stroke', 'accent-color'])
const RE_BORDA = /^(border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|column-rule(-color)?)$/
const PROPS_SOMBRA = new Set(['box-shadow', '-webkit-box-shadow', 'text-shadow'])
const PROPS_FUNDO = new Set(['background', 'background-color', 'background-image'])

const RE_IMAGEM = /^(?:repeating-)?(?:linear|radial|conic)-gradient\(|^url\(|^image-set\(|^none$/

/** Converte o atalho `background` em longhands que não resetam clip/size/position. */
function separarBackground(valor) {
  const camadas = dividir(valor, ',').map((c) => c.trim())
  const imagens = []
  let cor = null
  camadas.forEach((camada, idx) => {
    const tokens = dividir(camada, ' ').map((t) => t.trim()).filter(Boolean)
    let imagem = null
    for (const t of tokens) {
      if (RE_IMAGEM.test(t)) imagem = t
      else if (/^var\(/.test(t)) {
        if (/gradient|imagem|icone|image/i.test(t)) imagem = t
        else if (idx === camadas.length - 1) cor = t
      } else if (idx === camadas.length - 1 && (lerCor(t) || /^(transparent|currentcolor|inherit|initial|unset)$/i.test(t))) cor = t
    }
    imagens.push(imagem ?? 'none')
  })
  const saida = []
  if (imagens.some((i) => i !== 'none') || camadas.length === 1) saida.push(['background-image', imagens.join(', ')])
  saida.push(['background-color', cor ?? 'transparent'])
  return saida
}

function versaoEscura(declaracoes, fixo) {
  const saida = []
  for (const { prop, valor, importante } of declaracoes) {
    let mapa = null
    if (PROPS_TEXTO.has(prop)) mapa = mapaTexto
    else if (PROPS_FUNDO.has(prop)) mapa = mapaFundo
    else if (RE_BORDA.test(prop)) mapa = mapaBorda
    else if (PROPS_SOMBRA.has(prop)) {
      // Sombra interna gigante (ex.: "0 0 0 1000px #fff inset", usada para pintar o
      // fundo do autopreenchimento do navegador) funciona como fundo, não como sombra.
      mapa = /inset/.test(valor) && /\b\d{3,}px\b/.test(valor) ? mapaFundo : mapaSombra
    }
    else continue

    // Só interessa se envolve cor (ou var que resolve para cor)
    const resolvido = resolverVariaveis(valor)
    const temCor = RE_COR.test(resolvido)
    RE_COR.lastIndex = 0
    const mantemVar = PROPS_FUNDO.has(prop) && /var\(/.test(valor)
    // Valores que REMOVEM algo (outline: 0, box-shadow: none, border: 0...) também
    // são repetidos no tema escuro. Sem isso, uma regra genérica com versão escura
    // (ex.: :focus-visible) passaria a vencer a remoção e duplicaria o foco.
    const remocao = /^(transparent|none|0|0px|inherit|initial|unset|currentcolor)$/i.test(valor)
    if (!temCor && !mantemVar && !remocao) continue

    const base = temCor ? resolvido : valor
    const novo = fixo ? base : trocarCores(base, mapa)
    const imp = importante ? ' !important' : ''

    if (prop === 'background') {
      for (const [p, v] of separarBackground(novo)) saida.push(`${p}: ${v}${imp}`)
    } else {
      saida.push(`${prop}: ${novo}${imp}`)
    }
  }
  return saida
}

function prefixar(seletor, vue) {
  return dividir(seletor, ',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      // No .vue o atributo de escopo vai só no último seletor composto,
      // então o prefixo html[...] funciona sem :global().
      const pre = PREFIXO
      if (/^:root\b/.test(s)) return vue ? null : PREFIXO + s.slice(5)
      if (/^html\b/.test(s)) return vue ? null : PREFIXO + s.slice(4)
      return `${pre} ${s}`
    })
    .filter(Boolean)
    .join(',\n')
}

function gerar(nos, vue, recuo = '') {
  let out = ''
  for (const no of nos) {
    if (no.tipo === 'at') {
      const dentro = gerar(no.filhos, vue, recuo + '  ')
      if (dentro.trim()) out += `${recuo}${no.preludio} {\n${dentro}${recuo}}\n\n`
      continue
    }
    if (/::selection|::-webkit-scrollbar|::placeholder/.test(no.seletor)) continue
    const fixo = SELETORES_FIXOS.some((re) => re.test(no.seletor))
    // Variáveis do :root com nomes de superfície/texto/borda também mudam
    const ehRaiz = /^:root\b/.test(no.seletor.trim())
    let linhas
    if (ehRaiz) {
      if (vue) continue
      linhas = no.declaracoes
        .filter((d) => d.prop.startsWith('--'))
        .map(({ prop, valor }) => {
          let mapa = null
          if (/background|surface/.test(prop)) mapa = mapaFundo
          else if (/border/.test(prop)) mapa = mapaBorda
          else if (/text|ink|muted/.test(prop)) mapa = mapaTexto
          else if (/shadow/.test(prop)) mapa = mapaSombra
          if (!mapa || !RE_COR.test(valor)) { RE_COR.lastIndex = 0; return null }
          RE_COR.lastIndex = 0
          return `${prop}: ${trocarCores(valor, mapa)}`
        })
        .filter(Boolean)
    } else {
      linhas = versaoEscura(no.declaracoes, fixo)
    }
    if (!linhas.length) continue
    const sel = prefixar(no.seletor, vue)
    if (!sel) continue
    out += `${recuo}${sel.split('\n').join('\n' + recuo)} {\n${linhas.map((l) => `${recuo}  ${l};`).join('\n')}\n${recuo}}\n\n`
  }
  return out
}

/* =====================================================================
   6. EXECUÇÃO
   ===================================================================== */
const globais = listar(PASTA_ESTILOS, '.css').filter((p) => !IGNORAR_GLOBAIS.has(p.split(sep).pop()))
const vues = listar(SRC, '.vue')

// Variáveis primeiro (variables.css + todos os :root)
for (const p of [join(PASTA_ESTILOS, 'variables.css'), ...globais]) {
  if (existsSync(p)) coletarVariaveis(analisar(semComentarios(readFileSync(p, 'utf8'))))
}
for (const p of vues) {
  const css = cssDoVue(readFileSync(p, 'utf8'))
  if (css) coletarVariaveis(analisar(semComentarios(css)))
}

// CSS globais -> um arquivo gerado
let global = `/* CulturaPMW — TEMA ESCURO GERADO AUTOMATICAMENTE. Não edite à mão.
   Gerado por scripts/gerar-tema-escuro.mjs a partir dos CSS globais.
   Rode "npm run tema:escuro" para atualizar. Ajustes manuais: tema-escuro.css */\n\n`
// variables.css vem primeiro (só variáveis de superfície/texto)
const ordem = [join(PASTA_ESTILOS, 'variables.css'), ...globais]
for (const p of ordem) {
  if (!existsSync(p)) continue
  const trecho = gerar(analisar(semComentarios(readFileSync(p, 'utf8'))), false)
  if (trecho.trim()) global += `/* ---------- ${relative(RAIZ, p).split(sep).join('/')} ---------- */\n${trecho}`
}
writeFileSync(SAIDA_GLOBAL, global)

// Blocos scoped dos .vue -> trecho marcado dentro do próprio bloco
let alterados = 0
for (const p of vues) {
  const conteudo = readFileSync(p, 'utf8')
  const m = conteudo.match(RE_ESTILO_VUE)
  if (!m) continue
  const original = removerTrechoGerado(m[2]).replace(/\s+$/, '\n')
  const trecho = gerar(analisar(semComentarios(original)), true)
  const novoCss = trecho.trim() ? `${original}\n${INICIO_VUE}\n${trecho.trimEnd()}\n${FIM_VUE}\n` : original
  const novo = conteudo.replace(RE_ESTILO_VUE, (_, a, __, c) => a + novoCss + c)
  if (novo !== conteudo) { writeFileSync(p, novo); alterados++ }
}

console.log(`[tema-escuro] ${relative(RAIZ, SAIDA_GLOBAL)} atualizado; ${alterados} arquivo(s) .vue atualizado(s).`)
