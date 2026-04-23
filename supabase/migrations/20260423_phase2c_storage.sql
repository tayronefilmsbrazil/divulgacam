-- Divulgacam · Sub-fase 2C (Materiais + Configurações)
-- Cria o bucket 'materiais' e políticas de Storage RLS.
-- Não há mudanças de schema na DB — o update de campaigns já está coberto
-- pela policy "campaigns_update_by_manager" criada na Sub-fase 2A.

-- ============================================================
-- Bucket 'materiais'
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materiais',
  'materiais',
  true,
  52428800,  -- 50 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'video/mp4', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS (storage.objects)
-- ============================================================

-- Leitura pública: qualquer pessoa pode baixar/visualizar
DROP POLICY IF EXISTS "public_read_materiais" ON storage.objects;
CREATE POLICY "public_read_materiais"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'materiais');

-- Upload: gestor autenticado, somente na pasta da sua campanha
-- Estrutura de path: {campaign_id}/{timestamp}-{nome}
DROP POLICY IF EXISTS "managers_upload_materiais" ON storage.objects;
CREATE POLICY "managers_upload_materiais"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'materiais'
    AND (storage.foldername(name))[1] IN (
      SELECT campaign_id::text FROM public.managers WHERE id = auth.uid()
    )
  );

-- Update (ex.: substituir arquivo com upsert)
DROP POLICY IF EXISTS "managers_update_materiais" ON storage.objects;
CREATE POLICY "managers_update_materiais"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'materiais'
    AND (storage.foldername(name))[1] IN (
      SELECT campaign_id::text FROM public.managers WHERE id = auth.uid()
    )
  );

-- Delete: gestor pode remover apenas arquivos da sua campanha
DROP POLICY IF EXISTS "managers_delete_materiais" ON storage.objects;
CREATE POLICY "managers_delete_materiais"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'materiais'
    AND (storage.foldername(name))[1] IN (
      SELECT campaign_id::text FROM public.managers WHERE id = auth.uid()
    )
  );
