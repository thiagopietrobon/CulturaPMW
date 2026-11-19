# RF09 — Gerenciar situação dos eventos

## Casos de uso atendidos

- **UC 9.1 — Concluir evento automaticamente:** quando `data_fim` é atingido, eventos com situação `ATIVO` passam para `CONCLUIDO` e a alteração é persistida no PostgreSQL.
- **UC 9.2 — Remover evento encerrado:** ao completar 24 horas do encerramento, o evento deixa de aparecer na view pública. O registro não é apagado fisicamente e permanece disponível no histórico interno.

## Implementação

- `supabase/migrations/202611180006_rf09_situacao_eventos.sql`
  - Cria `public.culturapmw_concluir_eventos_encerrados()`.
  - Atualiza somente eventos `ATIVO` com `data_fim <= now()`; eventos `OCULTO` permanecem ocultos.
  - Atualiza `updated_at` junto com a situação.
  - Recria `vw_eventos_publicos` com o mesmo conjunto e ordem de colunas da view inicial, retirando eventos quando `data_fim <= now() - interval '24 hours'`.
  - Tenta habilitar `pg_cron` e agendar a função a cada minuto. Também agenda uma limpeza diária do histórico de execuções, mantendo sete dias. Se a extensão não estiver disponível ou não puder ser habilitada, a migration continua e emite um aviso. Nesse caso, a atualização persistida precisa de um agendador externo ou da habilitação de `pg_cron` no projeto.
- `src/models/Evento.ts`: a aplicação também apresenta a situação como concluída quando o horário final já passou e aplica o limite de 24 horas na visibilidade local.
- `src/services/AdminService.ts`: a listagem administrativa apresenta como concluído um evento ativo cujo horário final já passou, mesmo antes da próxima execução agendada.
- `src/views/public/EventoDetalhesView.vue`: quando o evento não está mais na view pública, a rota apresenta “Conteúdo indisponível”.

## Como aplicar

1. Execute `202611180006_rf09_situacao_eventos.sql` depois das migrations de Administração, RF01, RF06 e RF02.
2. No Supabase Dashboard, confira se o módulo Cron/`pg_cron` está habilitado e se existe o job `culturapmw-concluir-eventos`.
3. Caso o job não tenha sido criado, verifique o aviso retornado pelo SQL Editor e a disponibilidade de Cron no projeto. A view ainda remove eventos antigos das consultas públicas, mas a atualização persistida para `CONCLUIDO` requer um agendador.

## Como verificar

Verificar o job (somente se `pg_cron` estiver instalado):

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'culturapmw-concluir-eventos',
  'culturapmw-limpar-historico-cron'
);
```

Verificar as últimas execuções:

```sql
SELECT status, start_time, end_time, return_message
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid
  FROM cron.job
  WHERE jobname = 'culturapmw-concluir-eventos'
)
ORDER BY start_time DESC
LIMIT 10;
```

Executar manualmente a rotina durante um teste controlado:

```sql
SELECT public.culturapmw_concluir_eventos_encerrados();
```

A função retorna quantos eventos foram atualizados nessa execução. Ela processa todos os eventos `ATIVO` com encerramento atingido; portanto, execute-a somente no projeto de teste ou quando desejar processar os eventos vencidos do ambiente.

Para testar a retirada pública, use um evento de teste com `data_fim` definido para mais de 24 horas atrás. Ele deve continuar no histórico interno (`public.eventos`), mas não deve aparecer em `public.vw_eventos_publicos`; ao abrir `/eventos/:id`, a aplicação deve apresentar conteúdo indisponível.

## Observação sobre o agendador

A documentação do Supabase descreve Cron/`pg_cron` como agendador recorrente que pode executar SQL ou funções do banco e permite monitorar as execuções. A disponibilidade precisa ser confirmada no painel do projeto. Se o projeto não permitir `pg_cron`, será necessário configurar um scheduler externo para chamar a rotina de forma segura.

Referências oficiais:

- https://supabase.com/docs/guides/cron
- https://supabase.com/docs/guides/cron/install
- https://supabase.com/docs/guides/cron/quickstart
