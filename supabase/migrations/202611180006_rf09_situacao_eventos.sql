-- CulturaPMW - RF09: conclusão automática e retirada das listagens públicas.
-- Executar depois das migrations de Administração, RF01, RF06 e RF02.
-- A migration mantém os registros no banco; após 24 horas eles deixam de
-- aparecer na view pública, mas continuam disponíveis no histórico interno.

-- -----------------------------------------------------------------------------
-- 1. Concluir automaticamente os eventos cujo encerramento já foi atingido.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.culturapmw_concluir_eventos_encerrados()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_quantidade INTEGER := 0;
BEGIN
  UPDATE public.eventos AS e
     SET situacao = 'CONCLUIDO'::public.situacao_evento,
         updated_at = statement_timestamp()
   WHERE e.situacao = 'ATIVO'::public.situacao_evento
     AND e.data_fim <= statement_timestamp();

  GET DIAGNOSTICS v_quantidade = ROW_COUNT;
  RETURN v_quantidade;
END;
$$;

-- A função é destinada ao agendador do banco. Não fica disponível ao cliente.
REVOKE ALL ON FUNCTION public.culturapmw_concluir_eventos_encerrados()
  FROM PUBLIC, anon, authenticated;

-- Índice parcial para localizar rapidamente eventos ativos já encerrados.
CREATE INDEX IF NOT EXISTS idx_eventos_ativos_data_fim
  ON public.eventos (data_fim)
  WHERE situacao = 'ATIVO'::public.situacao_evento;

-- -----------------------------------------------------------------------------
-- 2. Atualizar a view pública.
--    Mantém a mesma ordem e os mesmos nomes de colunas da view inicial.
--    O limite é estrito: no instante em que completa 24 horas, o evento sai.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_eventos_publicos
WITH (security_invoker = false)
AS
SELECT
  e.*,
  CASE
    WHEN statement_timestamp() >= e.data_fim
      THEN 'CONCLUIDO'::public.situacao_evento
    ELSE e.situacao
  END AS situacao_atual,
  c.nome AS categoria_nome,
  r.id AS regiao_id,
  r.nome AS regiao_nome,
  l.cep,
  l.logradouro,
  l.numero,
  l.complemento,
  l.bairro,
  l.cidade,
  l.uf,
  p.nome AS produtor_nome,
  pr.descricao AS produtor_descricao,
  pr.telefone AS produtor_telefone
FROM public.eventos AS e
JOIN public.produtores AS pr ON e.produtor_id = pr.id
JOIN public.profiles AS p ON pr.id = p.id
JOIN public.categorias AS c ON e.categoria_id = c.id
JOIN public.localizacoes AS l ON l.evento_id = e.id
JOIN public.regioes AS r ON l.regiao_id = r.id
WHERE pr.status = 'APROVADO'::public.status_produtor
  AND (pr.suspenso_ate IS NULL OR pr.suspenso_ate <= statement_timestamp())
  AND e.situacao <> 'OCULTO'::public.situacao_evento
  AND e.data_fim > statement_timestamp() - INTERVAL '24 hours';

GRANT SELECT ON public.vw_eventos_publicos TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Agendar a execução a cada minuto, quando pg_cron estiver disponível.
--    A tentativa é protegida: se o projeto/plano não permitir pg_cron, a
--    migration continua aplicada e emite um aviso para configurar um scheduler.
--    O nome fixo torna a operação idempotente: reaplicar atualiza o mesmo job.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_available_extensions
     WHERE name = 'pg_cron'
  ) THEN
    BEGIN
      EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog';
      EXECUTE 'GRANT USAGE ON SCHEMA cron TO postgres';
      EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres';

      EXECUTE $job$
        SELECT cron.schedule(
          'culturapmw-concluir-eventos',
          '* * * * *',
          'SELECT public.culturapmw_concluir_eventos_encerrados();'
        )
      $job$;

      -- A tabela de histórico do pg_cron cresce a cada execução. Mantemos 7 dias.
      EXECUTE format(
        'SELECT cron.schedule(%L, %L, %L)',
        'culturapmw-limpar-historico-cron',
        '0 3 * * *',
        'DELETE FROM cron.job_run_details WHERE end_time < now() - interval ''7 days'''
      );

      RAISE NOTICE 'RF09: job de conclusão agendado a cada minuto e limpeza do histórico agendada diariamente.';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'RF09: não foi possível habilitar/agendar pg_cron neste projeto. A conclusão persistida precisa de um agendador disponível. Detalhe: %', SQLERRM;
    END;
  ELSE
    RAISE WARNING 'RF09: pg_cron não está disponível neste projeto. A retirada pública após 24 horas continua funcionando pela view, mas a atualização persistida de situacao exige um agendador externo ou pg_cron habilitado.';
  END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Verificações após execução (executar manualmente no SQL Editor).
-- -----------------------------------------------------------------------------
-- Verificar situação armazenada dos eventos encerrados:
-- SELECT id, titulo, situacao, data_fim
-- FROM public.eventos
-- WHERE data_fim <= now()
-- ORDER BY data_fim DESC;
--
-- Se pg_cron estiver habilitado, confirmar o agendamento:
-- SELECT jobid, jobname, schedule, active
-- FROM cron.job
-- WHERE jobname = 'culturapmw-concluir-eventos';
--
-- Consultar últimas execuções (substitua pelo jobid retornado acima):
-- SELECT status, start_time, end_time, return_message
-- FROM cron.job_run_details
-- WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'culturapmw-concluir-eventos')
-- ORDER BY start_time DESC
-- LIMIT 10;
