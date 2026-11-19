# RF02 — Gerenciamento de eventos

## Escopo implementado

O RF02 cobre os casos de uso da documentação:

- UC 2.1 — Publicar Evento: formulário de publicação, validação e persistência.
- UC 2.2 — Editar Evento: formulário preenchido com os dados do evento pertencente ao produtor.
- UC 2.3 — Excluir Evento: confirmação e remoção do evento e dos registros relacionados.
- UC 2.4 — Classificar Evento: seleção de uma categoria cadastrada pela administração.

A localização do evento é fornecida pelo componente `LocalizacaoEventoForm.vue` do RF06. Os links externos aceitam os tipos `INGRESSO`, `DIVULGACAO`, `CONTATO` e `OUTRO`.

## Telas e rotas

- `/produtor/eventos` — lista dos eventos do produtor.
- `/produtor/eventos/novo` — publicação de um evento.
- `/produtor/eventos/:id/editar` — edição de um evento próprio.

As três rotas exigem autenticação e cadastro de produtor aprovado.

## Arquivos principais

- `src/views/produtor/MeusEventosView.vue`
- `src/views/produtor/FormularioEventoView.vue`
- `src/components/formularios/LocalizacaoEventoForm.vue`
- `src/services/EventoService.ts`
- `src/services/LocalizacaoService.ts`
- `supabase/migrations/202611180005_rf02_gerenciar_eventos.sql`

## Persistência

A função `public.produtor_salvar_evento(uuid, jsonb)` grava ou atualiza, em uma única transação:

1. Dados do evento em `public.eventos`.
2. Endereço em `public.localizacoes`.
3. Links em `public.links_externos`.

A função verifica a sessão, o status aprovado do produtor, a propriedade do evento durante a edição, a categoria, as datas, o endereço em Palmas-TO e os links externos.

As imagens são enviadas para o bucket `eventos-imagens`. O bucket é público para leitura das imagens da agenda; upload, alteração e remoção ficam limitados à pasta UUID do produtor aprovado.

## Aplicação da migration

Executar `202611180005_rf02_gerenciar_eventos.sql` depois das migrations de administração, RF01 e RF06. A migration não recria tabelas-base.

## Testes de integração recomendados

1. Entrar com um produtor aprovado.
2. Abrir `/produtor/eventos` e conferir a listagem.
3. Publicar evento gratuito com endereço manual.
4. Publicar evento pago com CEP consultado no ViaCEP.
5. Adicionar pelo menos um link externo e uma imagem JPG/PNG/WebP menor que 5 MB.
6. Conferir o evento na página pública e abrir seus links e mapas.
7. Editar título, categoria, datas, endereço e links.
8. Excluir um evento de teste e conferir a remoção dos registros relacionados.
9. Tentar acessar as rotas com produtor pendente/reprovado/suspenso; o acesso deve ser bloqueado.
10. Conferir no painel administrativo a listagem e a moderação dos eventos publicados.

## Observação de status

O código das telas, serviços e migration foi preparado. A validação final depende de executar a migration no Supabase de destino e realizar os testes de integração com uma conta de produtor aprovada.
