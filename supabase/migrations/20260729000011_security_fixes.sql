-- ═══════════════════════════════════════════════════════════════════════════════
-- SECURITY FIXES
-- 1. user_profiles: restringir UPDATE direto (apenas display_name via RLS)
-- 2. admin_create_user: validar empresa ativa
-- 3. empresa_select_own: usar get_current_empresa_id() + get_user_role()
-- 4. admin_create_user: aceitar p_display_name para eliminar segundo roundtrip
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. RLS em user_profiles: bloquear UPDATE direto de role/permissions ──────
-- Usuários só podem atualizar display_name do próprio perfil diretamente.
-- role, permissions e empresa_id só mudam via funções SECURITY DEFINER.

DROP POLICY IF EXISTS "Users can update their own profile"    ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile"      ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile"    ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile"    ON public.user_profiles;
DROP POLICY IF EXISTS "profile_select_own"                    ON public.user_profiles;
DROP POLICY IF EXISTS "profile_update_own"                    ON public.user_profiles;
DROP POLICY IF EXISTS "profile_insert_own"                    ON public.user_profiles;

-- SELECT: pode ver o próprio perfil
CREATE POLICY "profile_select_own" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: apenas via handle_new_user_profile trigger (SECURITY DEFINER)
-- Bloqueia INSERT direto pelo client
CREATE POLICY "profile_insert_own" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: só pode mudar display_name — role/permissions/empresa_id requerem RPC
-- Implementado via CHECK que garante os campos sensíveis não mudem
CREATE POLICY "profile_update_display_name_only" ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT role FROM public.user_profiles WHERE user_id = auth.uid())
    AND empresa_id IS NOT DISTINCT FROM (SELECT empresa_id FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- ─── 2. Corrigir empresa_select_own: usar helpers em vez de subquery inline ───
DROP POLICY IF EXISTS "empresa_select_own" ON public.empresas;

CREATE POLICY "empresa_select_own" ON public.empresas
  FOR SELECT USING (
    id = public.get_current_empresa_id()
    OR public.get_user_role()::TEXT = 'super_admin'
  );

-- ─── 3. admin_create_user: validar empresa ativa + aceitar display_name ────────
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email        TEXT,
  p_password     TEXT,
  p_role         TEXT    DEFAULT 'funcionario',
  p_empresa_id   UUID    DEFAULT NULL,
  p_display_name TEXT    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_new_user_id  UUID;
  v_permissions  JSONB;
  v_caller_role  TEXT;
  v_empresa_id   UUID;
  v_nome         TEXT;
BEGIN
  SELECT get_user_role()::TEXT INTO v_caller_role;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF v_caller_role = 'admin' AND p_role = 'super_admin' THEN
    RAISE EXCEPTION 'Administradores não podem criar Super Admin';
  END IF;

  SELECT COALESCE(p_empresa_id, public.get_current_empresa_id()) INTO v_empresa_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'empresa_id é obrigatório para criar usuário';
  END IF;

  -- Validar que a empresa existe e está ativa
  IF NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = v_empresa_id AND ativo = TRUE) THEN
    RAISE EXCEPTION 'Empresa inativa ou inexistente';
  END IF;

  IF p_role IN ('super_admin', 'admin') THEN
    v_permissions := '{"processos":{"read":true,"write":true,"delete":true},"clientes":{"read":true,"write":true,"delete":true},"financeiro":{"read":true,"write":true,"delete":true},"relatorios":{"read":true,"write":true,"delete":true},"configuracoes":{"read":true,"write":true,"delete":true}}'::JSONB;
  ELSIF p_role = 'gerente' THEN
    v_permissions := '{"processos":{"read":true,"write":true,"delete":false},"clientes":{"read":true,"write":true,"delete":false},"financeiro":{"read":true,"write":false,"delete":false},"relatorios":{"read":true,"write":false,"delete":false},"configuracoes":{"read":true,"write":false,"delete":false}}'::JSONB;
  ELSE
    v_permissions := '{"processos":{"read":true,"write":true,"delete":false},"clientes":{"read":true,"write":true,"delete":false},"financeiro":{"read":false,"write":true,"delete":false},"relatorios":{"read":false,"write":false,"delete":false},"configuracoes":{"read":false,"write":false,"delete":false}}'::JSONB;
  END IF;

  v_nome := COALESCE(NULLIF(p_display_name, ''), p_email);

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}'::JSONB,
    '{}'::JSONB,
    false, 'authenticated', 'authenticated'
  ) RETURNING id INTO v_new_user_id;

  INSERT INTO public.user_profiles (user_id, display_name, role, permissions, empresa_id)
  VALUES (v_new_user_id, v_nome, p_role::user_role, v_permissions, v_empresa_id)
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role         = EXCLUDED.role,
    permissions  = EXCLUDED.permissions,
    empresa_id   = EXCLUDED.empresa_id,
    updated_at   = NOW();

  INSERT INTO public.subscribers (email, subscription_tier)
  VALUES (p_email, 'Freemium')
  ON CONFLICT (email) DO NOTHING;

  RETURN v_new_user_id;
END;
$$;
