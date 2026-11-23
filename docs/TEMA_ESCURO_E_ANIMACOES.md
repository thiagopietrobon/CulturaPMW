# Tema escuro, animações de toque e transições de página

## Tema escuro
- O tema é controlado pelo atributo `data-theme` da tag `<html>` (`claro` ou `escuro`).
- Botão sol/lua: `src/components/layout/BotaoTema.vue`. Ele aparece no cabeçalho do site, na barra superior do produtor e do admin, e como botão flutuante (canto inferior direito) nas telas sem cabeçalho: login, cadastro, status e formulários.
- A escolha fica salva no navegador. Sem escolha salva, o site segue o tema do sistema.
- Lógica: `src/composables/useTema.ts`. O `index.html` aplica o tema antes do carregamento, para a tela não piscar branca.

### Como o CSS escuro é feito
As cores escuras são **geradas automaticamente** a partir do CSS claro, por `scripts/gerar-tema-escuro.mjs`:
- CSS globais → `src/assets/styles/tema-escuro.gerado.css`
- `.vue` → trecho marcado no fim de cada `<style scoped>`

O gerador roda sozinho antes de `npm run dev` e `npm run build`. Para rodar à mão: `npm run tema:escuro`.

**Não edite os trechos gerados.** Para ajustar algo manualmente:
- CSS global → `src/assets/styles/tema-escuro.css`
- componente → regra `html[data-theme='escuro'] .classe-pai .classe` no próprio `<style scoped>`, **fora** do trecho gerado (a classe-pai extra garante prioridade).

## Animações de toque
`src/composables/useToque.ts` (instalado no `main.ts`): botões, links de navegação e cards afundam levemente ao toque e voltam com efeito de mola, com uma onda (ripple) a partir do ponto tocado. Para aplicar a outro elemento, adicione a classe `cp-toque`.

## Transições de página
- `src/assets/styles/transicoes-paginas.css`
- Site público e admin: a página atual sai rápido e a nova entra subindo (`PublicLayout.vue`, `AdminLayout.vue`).
- Entre áreas diferentes: cross-fade (`App.vue`). Login/cadastro e área do produtor mantêm as transições que já tinham.
- Barra fina no topo enquanto a próxima página carrega.
- Ao trocar de página, a rolagem volta ao topo depois da saída da página anterior (`router/index.ts`).

Tudo respeita a opção "reduzir movimento" do sistema operacional.
