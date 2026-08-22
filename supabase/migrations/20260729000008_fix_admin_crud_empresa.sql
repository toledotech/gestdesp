-- Corrigir admin_update_user: permitir 'gerente' e validar mesma empresa
-- Corrigir admin_ban_user / admin_unban_user: validar mesma empresa

CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id UUID,
  p_display_name TEXT,
  p_email        TEXT,
  p_role         TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_permissions   JSONB;
  v_old_email     TEXT;
  v_caller_role   TEXT;
  v_caller_emp    UUID;
  v_target_role   TEXT;
  v_target_emp    UUID;
BEGIN
  SELECT get_user_role()::TEXT, get_current_empresa_id()
  INTO v_caller_role, v_caller_emp;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT role::TEXT, empresa_id
  INTO v_target_role, v_target_emp
  FROM public.user_profiles WHERE user_id = target_user_id;

  -- Admin só pode editar usuários da própria empresa
  IF v_caller_role = 'admin' AND v_target_emp != v_caller_emp THEN
    RAISE EXCEPTION 'Acesso negado: usuário pertence a outra empresa';
  END IF;

  -- Admin não pode editar super_admins
  IF v_caller_role = 'admin' AND v_target_role = 'super_admin' THEN
    RAISE EXCEPTION 'Administradores não podem editar o Super Admin';
  END IF;

  -- Admin só pode atribuir funcionario, gerente ou admin
  IF v_caller_role = 'admin' AND p_role = 'super_admin' THEN
    RAISE EXCEPTION 'Administradores não podem atribuir o perfil Super Admin';
  END IF;

  IF p_role IN ('super_admin', 'admin') THEN
    v_permissions := '{"processos":{"read":true,"write":true,"delete":true},"clientes":{"read":true,"write":true,"delete":true},"financeiro":{"read":true,"write":true,"delete":true},"relatorios":{"read":true,"write":true,"delete":true},"configuracoes":{"read":true,"write":true,"delete":true}}'::JSONB;
  ELSIF p_role = 'gerente' THEN
    v_permissions := '{"processos":{"read":true,"write":true,"delete":false},"clientes":{"read":true,"write":true,"delete":false},"financeiro":{"read":true,"write":false,"delete":false},"relatorios":{"read":true,"write":false,"delete":false},"configuracoes":{"read":true,"write":false,"delete":false}}'::JSONB;
  ELSE
    v_permissions := '{"processos":{"read":true,"write":true,"delete":false},"clientes":{"read":true,"write":true,"delete":false},"financeiro":{"read":false,"write":true,"delete":false},"relatorios":{"read":false,"write":false,"delete":false},"configuracoes":{"read":false,"write":false,"delete":false}}'::JSONB;
  END IF;

  SELECT email INTO v_old_email FROM auth.users WHERE id = target_user_id;

  UPDATE auth.users
  SET email = p_email, email_confirmed_at = NOW(), updated_at = NOW()
  WHERE id = target_user_id;

  UPDATE public.user_profiles
  SET display_name = p_display_name,
      role         = p_role::user_role,
      permissions  = v_permissions,
      updated_at   = NOW()
  WHERE user_id = target_user_id;

  UPDATE public.subscribers SET email = p_email WHERE email = v_old_email;
END;
$$;

-- Corrigir admin_ban_user: validar mesma empresa
CREATE OR REPLACE FUNCTION public.admin_ban_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_emp  UUID;
  v_target_emp  UUID;
BEGIN
  SELECT get_user_role()::TEXT, get_current_empresa_id()
  INTO v_caller_role, v_caller_emp;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT empresa_id INTO v_target_emp FROM public.user_profiles WHERE user_id = target_user_id;

  IF v_caller_role = 'admin' AND v_target_emp != v_caller_emp THEN
    RAISE EXCEPTION 'Acesso negado: usuário pertence a outra empresa';
  END IF;

  UPDATE auth.users SET banned_until = 'infinity'::TIMESTAMPTZ WHERE id = target_user_id;
END;
$$;

-- Corrigir admin_unban_user: validar mesma empresa
CREATE OR REPLACE FUNCTION public.admin_unban_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_emp  UUID;
  v_target_emp  UUID;
BEGIN
  SELECT get_user_role()::TEXT, get_current_empresa_id()
  INTO v_caller_role, v_caller_emp;

  IF v_caller_role NOT IN ('super_admin', 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT empresa_id INTO v_target_emp FROM public.user_profiles WHERE user_id = target_user_id;

  IF v_caller_role = 'admin' AND v_target_emp != v_caller_emp THEN
    RAISE EXCEPTION 'Acesso negado: usuário pertence a outra empresa';
  END IF;

  UPDATE auth.users SET banned_until = NULL WHERE id = target_user_id;
END;
$$;
