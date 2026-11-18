# RF06 — Gerenciamento de localização

## Escopo implementado

A implementação do RF06 fornece um componente reutilizável para a seção de localização dos formulários de publicação e edição de eventos, além de um serviço responsável por consultar regiões, identificar sugestões, validar e persistir endereços.

### UC 6.1 — Cadastrar localização do evento

- Formulário para logradouro, número, complemento, bairro, cidade, UF, CEP e região.
- Preenchimento manual disponível mesmo quando o serviço de CEP estiver indisponível.
- Validação dos campos obrigatórios e da abrangência Palmas-TO.
- Persistência em `public.localizacoes`, associada ao `evento_id`, por `upsert`.

### UC 6.2 — Consultar endereço por CEP

- Consulta opcional ao ViaCEP.
- CEP normalizado para oito dígitos.
- Preenchimento dos dados retornados pelo serviço.
- CEP inválido, inexistente ou indisponibilidade do ViaCEP apresentam mensagens e permitem continuar manualmente.

### UC 6.3 — Identificar região

- O sistema sugere uma região apenas quando encontra uma referência textual reconhecida no bairro/logradouro: Taquaruçu, Taquaralto, Jardim Aureny I-IV, Orla da Graciosa, Plano Diretor Norte ou Plano Diretor Sul.
- A sugestão deve ser conferida pelo produtor.
- Quando não houver correspondência segura, a região deve ser selecionada manualmente.
- A lista de opções é carregada da tabela `regioes`, sem IDs fixos no código.

## Arquivos

- `src/components/formularios/LocalizacaoEventoForm.vue`
- `src/services/LocalizacaoService.ts`
- `src/services/ServicoCEP.ts`
- `supabase/migrations/202611180004_rf06_localizacao.sql`

## Integração com RF02

O componente recebe e emite `DadosLocalizacaoEvento` por `v-model`. O formulário de publicação/edição do RF02 deve incluir `<LocalizacaoEventoForm v-model="formulario.localizacao" />`. O estado inicial pode ser criado com `criarLocalizacaoVazia()` exportada por `LocalizacaoService.ts`.

Após salvar o evento e obter seu UUID, chamar `localizacaoService.salvar(eventoId, formulario.localizacao)`. Na edição, carregar os dados com `localizacaoService.buscarPorEvento(eventoId)`.

O componente expõe `validar()` e `obterDados()` via `defineExpose`, para o formulário pai validar a localização antes de concluir o salvamento do evento.

## Migration SQL

Executar `202611180004_rf06_localizacao.sql` após a configuração inicial, migration administrativa e RF01. A migration cria políticas RLS para produtores aprovados trabalharem apenas nas localizações dos próprios eventos. Também permite que o produtor autenticado consulte somente os próprios eventos, necessário para verificar a associação da localização. A política administrativa existente permanece válida.

## Observação de escopo

A especificação do projeto não fornece um cadastro oficial de bairros por região. Por isso, a identificação automática é conservadora e baseada apenas em referências reconhecíveis; a seleção manual permanece disponível e obrigatória quando não há correspondência. A persistência será acionada pelo fluxo do RF02, quando o evento já possuir `id`.
