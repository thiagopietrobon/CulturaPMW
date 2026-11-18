-- CulturaPMW - RF06: gerenciamento da localização dos eventos.
-- Executar depois da configuração inicial, da migration administrativa e do RF01.
-- Permite ao produtor aprovado consultar e gravar a localização dos próprios eventos.
-- O administrador continua utilizando as políticas administrativas já existentes.

ALTER TABLE public.localizacoes ENABLE ROW LEVEL SECURITY;

-- O RF01 restringiu a leitura pública de eventos. Para o produtor consultar
-- os próprios eventos e suas localizações na área autenticada, é necessária
-- uma política específica de leitura dos eventos vinculados à sua conta.
DROP POLICY IF EXISTS "culturapmw_produtor_select_eventos_proprios" ON public.eventos;
CREATE POLICY "culturapmw_produtor_select_eventos_proprios"
  ON public.eventos
  FOR SELECT
  TO authenticated
  USING (produtor_id = auth.uid());

-- O produtor pode consultar a localização dos eventos que pertencem à própria conta.
DROP POLICY IF EXISTS "culturapmw_produtor_select_localizacao_propria" ON public.localizacoes;
CREATE POLICY "culturapmw_produtor_select_localizacao_propria"
  ON public.localizacoes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.eventos e
      WHERE e.id = localizacoes.evento_id
        AND e.produtor_id = auth.uid()
    )
  );

-- Somente produtores aprovados podem associar localização aos próprios eventos.
DROP POLICY IF EXISTS "culturapmw_produtor_insert_localizacao_propria" ON public.localizacoes;
CREATE POLICY "culturapmw_produtor_insert_localizacao_propria"
  ON public.localizacoes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.eventos e
      JOIN public.produtores p ON p.id = e.produtor_id
      WHERE e.id = localizacoes.evento_id
        AND e.produtor_id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

-- A atualização exige que o evento continue pertencendo ao produtor e que ele esteja aprovado.
DROP POLICY IF EXISTS "culturapmw_produtor_update_localizacao_propria" ON public.localizacoes;
CREATE POLICY "culturapmw_produtor_update_localizacao_propria"
  ON public.localizacoes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.eventos e
      WHERE e.id = localizacoes.evento_id
        AND e.produtor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.eventos e
      JOIN public.produtores p ON p.id = e.produtor_id
      WHERE e.id = localizacoes.evento_id
        AND e.produtor_id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

-- A exclusão da localização pelo produtor também depende de evento próprio e aprovação.
DROP POLICY IF EXISTS "culturapmw_produtor_delete_localizacao_propria" ON public.localizacoes;
CREATE POLICY "culturapmw_produtor_delete_localizacao_propria"
  ON public.localizacoes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.eventos e
      JOIN public.produtores p ON p.id = e.produtor_id
      WHERE e.id = localizacoes.evento_id
        AND e.produtor_id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.localizacoes TO authenticated;
GRANT SELECT ON public.regioes TO anon, authenticated;

-- Índice auxiliar para filtros por região e consultas de localização.
CREATE INDEX IF NOT EXISTS idx_localizacoes_regiao_id
  ON public.localizacoes (regiao_id);
