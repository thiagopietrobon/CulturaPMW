-- CulturaPMW - RF02: publicar, editar, excluir e classificar eventos.
-- Executar depois das migrations de Administração, RF01 e RF06.
-- A operação de salvar é transacional: evento, localização e links são gravados juntos.

-- -----------------------------------------------------------------------------
-- 1. Função transacional para publicar/editar evento do produtor autenticado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.produtor_salvar_evento(
  p_evento_id UUID,
  p_dados JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_evento_id UUID;
  v_titulo TEXT;
  v_descricao TEXT;
  v_imagem_url TEXT;
  v_categoria_id INTEGER;
  v_data_inicio TIMESTAMPTZ;
  v_data_fim TIMESTAMPTZ;
  v_gratuito BOOLEAN;
  v_valor_ingresso NUMERIC(10, 2);
  v_localizacao JSONB;
  v_links JSONB;
  v_cep TEXT;
  v_logradouro TEXT;
  v_numero TEXT;
  v_complemento TEXT;
  v_bairro TEXT;
  v_cidade TEXT;
  v_uf TEXT;
  v_regiao_id INTEGER;
  v_link JSONB;
  v_tipo_link public.tipo_link;
  v_url TEXT;
  v_status public.status_produtor;
  v_suspenso_ate TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'É necessário estar autenticado para publicar ou editar eventos.';
  END IF;

  SELECT p.status, p.suspenso_ate
    INTO v_status, v_suspenso_ate
    FROM public.produtores p
   WHERE p.id = v_user_id;

  IF NOT FOUND OR v_status <> 'APROVADO'::public.status_produtor
     OR (v_suspenso_ate IS NOT NULL AND v_suspenso_ate > now()) THEN
    RAISE EXCEPTION 'Somente produtores aprovados e sem suspensão ativa podem gerenciar eventos.';
  END IF;

  IF p_dados IS NULL OR jsonb_typeof(p_dados) <> 'object' THEN
    RAISE EXCEPTION 'Os dados do evento estão inválidos.';
  END IF;

  v_titulo := NULLIF(BTRIM(p_dados ->> 'titulo'), '');
  v_descricao := NULLIF(BTRIM(p_dados ->> 'descricao'), '');
  v_imagem_url := NULLIF(BTRIM(p_dados ->> 'imagem_url'), '');

  IF v_titulo IS NULL OR char_length(v_titulo) > 140 THEN
    RAISE EXCEPTION 'Informe um título para o evento com até 140 caracteres.';
  END IF;
  IF v_descricao IS NULL OR char_length(v_descricao) > 5000 THEN
    RAISE EXCEPTION 'Informe uma descrição para o evento com até 5.000 caracteres.';
  END IF;
  IF v_imagem_url IS NOT NULL AND v_imagem_url !~* '^https?://' THEN
    RAISE EXCEPTION 'O endereço da imagem do evento é inválido.';
  END IF;

  IF COALESCE(p_dados ->> 'categoria_id', '') !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Selecione uma categoria válida para o evento.';
  END IF;
  v_categoria_id := (p_dados ->> 'categoria_id')::INTEGER;
  IF NOT EXISTS (SELECT 1 FROM public.categorias c WHERE c.id = v_categoria_id) THEN
    RAISE EXCEPTION 'A categoria selecionada não existe ou não está disponível.';
  END IF;

  BEGIN
    v_data_inicio := (p_dados ->> 'data_inicio')::TIMESTAMPTZ;
    v_data_fim := (p_dados ->> 'data_fim')::TIMESTAMPTZ;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Informe datas e horários válidos para o evento.';
  END;

  IF v_data_inicio IS NULL OR v_data_fim IS NULL OR v_data_fim <= v_data_inicio THEN
    RAISE EXCEPTION 'O término do evento deve ser posterior ao início.';
  END IF;

  IF COALESCE(p_dados ->> 'gratuito', 'true') NOT IN ('true', 'false') THEN
    RAISE EXCEPTION 'Informe se o evento é gratuito ou pago.';
  END IF;
  v_gratuito := COALESCE((p_dados ->> 'gratuito')::BOOLEAN, TRUE);
  BEGIN
    v_valor_ingresso := COALESCE(NULLIF(p_dados ->> 'valor_ingresso', '')::NUMERIC, 0);
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Informe um valor de ingresso válido.';
  END;
  IF v_gratuito THEN
    v_valor_ingresso := 0;
  ELSIF v_valor_ingresso <= 0 THEN
    RAISE EXCEPTION 'Informe um valor de ingresso maior que zero.';
  END IF;

  v_localizacao := p_dados -> 'localizacao';
  IF v_localizacao IS NULL OR jsonb_typeof(v_localizacao) <> 'object' THEN
    RAISE EXCEPTION 'Informe a localização do evento.';
  END IF;

  v_cep := NULLIF(REGEXP_REPLACE(COALESCE(v_localizacao ->> 'cep', ''), '[^0-9]', '', 'g'), '');
  v_logradouro := NULLIF(BTRIM(v_localizacao ->> 'logradouro'), '');
  v_numero := NULLIF(BTRIM(v_localizacao ->> 'numero'), '');
  v_complemento := NULLIF(BTRIM(v_localizacao ->> 'complemento'), '');
  v_bairro := NULLIF(BTRIM(v_localizacao ->> 'bairro'), '');
  v_cidade := COALESCE(NULLIF(BTRIM(v_localizacao ->> 'cidade'), ''), 'Palmas');
  v_uf := UPPER(COALESCE(NULLIF(BTRIM(v_localizacao ->> 'uf'), ''), 'TO'));

  IF COALESCE(v_localizacao ->> 'regiao_id', '') !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'Selecione a região do evento.';
  END IF;
  v_regiao_id := (v_localizacao ->> 'regiao_id')::INTEGER;

  IF v_logradouro IS NULL OR v_bairro IS NULL THEN
    RAISE EXCEPTION 'Informe o logradouro e o bairro do evento.';
  END IF;
  IF LOWER(v_cidade) <> 'palmas' OR v_uf <> 'TO' THEN
    RAISE EXCEPTION 'O CulturaPMW aceita eventos realizados em Palmas-TO.';
  END IF;
  IF v_cep IS NOT NULL AND char_length(v_cep) <> 8 THEN
    RAISE EXCEPTION 'O CEP deve conter 8 números.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.regioes r WHERE r.id = v_regiao_id) THEN
    RAISE EXCEPTION 'A região selecionada não existe. Atualize a página e selecione novamente.';
  END IF;

  v_links := COALESCE(p_dados -> 'links', '[]'::JSONB);
  IF jsonb_typeof(v_links) <> 'array' THEN
    RAISE EXCEPTION 'A lista de links externos está inválida.';
  END IF;
  IF jsonb_array_length(v_links) > 10 THEN
    RAISE EXCEPTION 'O evento pode possuir no máximo 10 links externos.';
  END IF;

  -- Edição: bloqueia a linha e confirma a propriedade do evento.
  IF p_evento_id IS NOT NULL THEN
    SELECT e.id
      INTO v_evento_id
      FROM public.eventos e
     WHERE e.id = p_evento_id
       AND e.produtor_id = v_user_id
     FOR UPDATE;

    IF v_evento_id IS NULL THEN
      RAISE EXCEPTION 'Evento não encontrado ou você não possui permissão para editá-lo.';
    END IF;

    UPDATE public.eventos
       SET categoria_id = v_categoria_id,
           titulo = v_titulo,
           descricao = v_descricao,
           imagem_url = v_imagem_url,
           data_inicio = v_data_inicio,
           data_fim = v_data_fim,
           gratuito = v_gratuito,
           valor_ingresso = v_valor_ingresso,
           updated_at = now()
     WHERE id = v_evento_id;
  ELSE
    INSERT INTO public.eventos (
      produtor_id, categoria_id, titulo, descricao, imagem_url,
      data_inicio, data_fim, gratuito, valor_ingresso, situacao
    ) VALUES (
      v_user_id, v_categoria_id, v_titulo, v_descricao, v_imagem_url,
      v_data_inicio, v_data_fim, v_gratuito, v_valor_ingresso,
      'ATIVO'::public.situacao_evento
    )
    RETURNING id INTO v_evento_id;
  END IF;

  -- Associação 1:1 da localização ao evento.
  INSERT INTO public.localizacoes (
    evento_id, regiao_id, cep, logradouro, numero, complemento,
    bairro, cidade, uf
  ) VALUES (
    v_evento_id, v_regiao_id, v_cep, v_logradouro, v_numero, v_complemento,
    v_bairro, 'Palmas', 'TO'
  )
  ON CONFLICT (evento_id) DO UPDATE SET
    regiao_id = EXCLUDED.regiao_id,
    cep = EXCLUDED.cep,
    logradouro = EXCLUDED.logradouro,
    numero = EXCLUDED.numero,
    complemento = EXCLUDED.complemento,
    bairro = EXCLUDED.bairro,
    cidade = EXCLUDED.cidade,
    uf = EXCLUDED.uf;

  -- Substitui os links no mesmo commit da publicação/edição.
  DELETE FROM public.links_externos WHERE evento_id = v_evento_id;

  FOR v_link IN
    SELECT item.valor
      FROM jsonb_array_elements(v_links) AS item(valor)
  LOOP
    v_url := NULLIF(BTRIM(v_link ->> 'url'), '');
    IF v_url IS NULL THEN
      RAISE EXCEPTION 'Foi informado um link externo sem endereço.';
    END IF;
    IF v_url !~* '^https?://' THEN
      RAISE EXCEPTION 'Os links externos devem começar com http:// ou https://.';
    END IF;
    IF char_length(v_url) > 2048 THEN
      RAISE EXCEPTION 'Um dos links externos ultrapassa o tamanho permitido.';
    END IF;

    BEGIN
      IF NULLIF(BTRIM(v_link ->> 'tipo'), '') IS NULL THEN
        RAISE EXCEPTION 'Selecione um tipo para cada link externo.';
      END IF;
      v_tipo_link := (v_link ->> 'tipo')::public.tipo_link;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Selecione um tipo válido para cada link externo.';
    END;

    INSERT INTO public.links_externos (evento_id, tipo, url)
    VALUES (v_evento_id, v_tipo_link, v_url);
  END LOOP;

  RETURN v_evento_id;
END;
$$;

REVOKE ALL ON FUNCTION public.produtor_salvar_evento(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.produtor_salvar_evento(UUID, JSONB) TO authenticated;

-- Produtores não podem alterar diretamente a situação de um evento (por exemplo,
-- reativar uma publicação ocultada pela administração). A moderação permanece administrativa.
CREATE OR REPLACE FUNCTION public.culturapmw_proteger_situacao_evento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.situacao IS DISTINCT FROM OLD.situacao
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Somente a administração pode alterar a situação de um evento.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.culturapmw_proteger_situacao_evento() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS culturapmw_proteger_situacao_evento ON public.eventos;
CREATE TRIGGER culturapmw_proteger_situacao_evento
  BEFORE UPDATE OF situacao ON public.eventos
  FOR EACH ROW EXECUTE FUNCTION public.culturapmw_proteger_situacao_evento();

-- -----------------------------------------------------------------------------
-- 2. Políticas RLS do produtor para seus próprios eventos e links.
-- -----------------------------------------------------------------------------
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links_externos ENABLE ROW LEVEL SECURITY;

-- A migration RF06 já criou a política de SELECT dos próprios eventos.
-- Estas políticas reforçam a aprovação/suspensão na escrita.
DROP POLICY IF EXISTS "Produtor aprovado insere evento" ON public.eventos;
DROP POLICY IF EXISTS "culturapmw_produtor_insert_eventos_aprovado" ON public.eventos;
CREATE POLICY "culturapmw_produtor_insert_eventos_aprovado"
  ON public.eventos FOR INSERT TO authenticated
  WITH CHECK (
    produtor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.produtores p
      WHERE p.id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

DROP POLICY IF EXISTS "Produtor edita proprio evento" ON public.eventos;
DROP POLICY IF EXISTS "culturapmw_produtor_update_eventos_proprios" ON public.eventos;
CREATE POLICY "culturapmw_produtor_update_eventos_proprios"
  ON public.eventos FOR UPDATE TO authenticated
  USING (
    produtor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.produtores p
      WHERE p.id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  )
  WITH CHECK (
    produtor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.produtores p
      WHERE p.id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

DROP POLICY IF EXISTS "Produtor exclui proprio evento" ON public.eventos;
DROP POLICY IF EXISTS "culturapmw_produtor_delete_eventos_proprios" ON public.eventos;
CREATE POLICY "culturapmw_produtor_delete_eventos_proprios"
  ON public.eventos FOR DELETE TO authenticated
  USING (
    produtor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.produtores p
      WHERE p.id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

DROP POLICY IF EXISTS "culturapmw_produtor_select_links_proprios" ON public.links_externos;
CREATE POLICY "culturapmw_produtor_select_links_proprios"
  ON public.links_externos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.eventos e
      WHERE e.id = links_externos.evento_id
        AND e.produtor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "culturapmw_produtor_insert_links_proprios" ON public.links_externos;
CREATE POLICY "culturapmw_produtor_insert_links_proprios"
  ON public.links_externos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.eventos e
      JOIN public.produtores p ON p.id = e.produtor_id
      WHERE e.id = links_externos.evento_id
        AND e.produtor_id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

DROP POLICY IF EXISTS "culturapmw_produtor_delete_links_proprios" ON public.links_externos;
CREATE POLICY "culturapmw_produtor_delete_links_proprios"
  ON public.links_externos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.eventos e
      JOIN public.produtores p ON p.id = e.produtor_id
      WHERE e.id = links_externos.evento_id
        AND e.produtor_id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.links_externos TO authenticated;
GRANT SELECT ON public.categorias, public.regioes TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_eventos_produtor_data_inicio
  ON public.eventos (produtor_id, data_inicio);

-- -----------------------------------------------------------------------------
-- 3. Bucket público para imagens de eventos, com upload restrito ao produtor.
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'eventos-imagens',
  'eventos-imagens',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::TEXT[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "culturapmw_eventos_imagens_public_read" ON storage.objects;
CREATE POLICY "culturapmw_eventos_imagens_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'eventos-imagens');

DROP POLICY IF EXISTS "culturapmw_eventos_imagens_insert_proprio" ON storage.objects;
CREATE POLICY "culturapmw_eventos_imagens_insert_proprio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'eventos-imagens'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND EXISTS (
      SELECT 1 FROM public.produtores p
      WHERE p.id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

DROP POLICY IF EXISTS "culturapmw_eventos_imagens_update_proprio" ON storage.objects;
CREATE POLICY "culturapmw_eventos_imagens_update_proprio"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'eventos-imagens'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND EXISTS (
      SELECT 1 FROM public.produtores p
      WHERE p.id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  )
  WITH CHECK (
    bucket_id = 'eventos-imagens'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND EXISTS (
      SELECT 1 FROM public.produtores p
      WHERE p.id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );

DROP POLICY IF EXISTS "culturapmw_eventos_imagens_delete_proprio" ON storage.objects;
CREATE POLICY "culturapmw_eventos_imagens_delete_proprio"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'eventos-imagens'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND EXISTS (
      SELECT 1 FROM public.produtores p
      WHERE p.id = auth.uid()
        AND p.status = 'APROVADO'::public.status_produtor
        AND (p.suspenso_ate IS NULL OR p.suspenso_ate <= now())
    )
  );
