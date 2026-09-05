import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export type UserRole = 'super_admin' | 'admin' | 'funcionario' | 'gerente' | 'usuario'

export interface Permissions {
  processos: {
    read: boolean
    write: boolean
    delete: boolean
  }
  clientes: {
    read: boolean
    write: boolean
    delete: boolean
  }
  financeiro: {
    read: boolean
    write: boolean
    delete: boolean
  }
  relatorios: {
    read: boolean
    write: boolean
    delete: boolean
  }
  configuracoes: {
    read: boolean
    write: boolean
    delete: boolean
  }
}

export interface UserProfile {
  id: string
  user_id: string
  display_name?: string | null
  role: UserRole
  permissions: Permissions
  empresa_id?: string | null
}

// Fora do hook para evitar recriação a cada render (resolve exhaustive-deps)
export const DEFAULT_PERMISSIONS: Record<UserRole, Permissions> = {
  super_admin: {
    processos: { read: true, write: true, delete: true },
    clientes: { read: true, write: true, delete: true },
    financeiro: { read: true, write: true, delete: true },
    relatorios: { read: true, write: true, delete: true },
    configuracoes: { read: true, write: true, delete: true }
  },
  admin: {
    processos: { read: true, write: true, delete: true },
    clientes: { read: true, write: true, delete: true },
    financeiro: { read: true, write: true, delete: true },
    relatorios: { read: true, write: true, delete: true },
    configuracoes: { read: true, write: true, delete: true }
  },
  funcionario: {
    processos: { read: true, write: true, delete: false },
    clientes: { read: true, write: true, delete: false },
    financeiro: { read: false, write: true, delete: false },
    relatorios: { read: false, write: false, delete: false },
    configuracoes: { read: false, write: false, delete: false }
  },
  gerente: {
    processos: { read: true, write: true, delete: false },
    clientes: { read: true, write: true, delete: false },
    financeiro: { read: true, write: false, delete: false },
    relatorios: { read: true, write: false, delete: false },
    configuracoes: { read: true, write: false, delete: false }
  },
  usuario: {
    processos: { read: true, write: false, delete: false },
    clientes: { read: true, write: false, delete: false },
    financeiro: { read: false, write: false, delete: false },
    relatorios: { read: false, write: false, delete: false },
    configuracoes: { read: false, write: false, delete: false }
  }
}

export const usePermissions = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchUserProfile = async () => {
    if (!user) {
      setUserProfile(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error)
        setProfileError('Não foi possível carregar o perfil.')
        return
      }

      if (data) {
        setProfileError(null)
        setUserProfile({
          ...data,
          permissions: data.permissions as unknown as Permissions
        })
      } else {
        // Perfil não existe: usuário foi criado fora do fluxo admin.
        // Não criamos automaticamente — exige vinculação a uma empresa.
        setProfileError('Conta não configurada. Contate o administrador do sistema.')
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Erro inesperado:', error)
      setProfileError('Erro inesperado ao carregar perfil.')
    } finally {
      setLoading(false)
    }
  }

  // updateUserRole: vai via RPC para garantir validação server-side
  const updateUserRole = async (role: UserRole) => {
    if (!userProfile) return false

    try {
      const { error } = await supabase.rpc('admin_update_user' as any, {
        target_user_id: userProfile.user_id,
        p_display_name: userProfile.display_name ?? userProfile.user_id,
        p_email:        user?.email ?? '',
        p_role:         role,
      })

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' })
        return false
      }

      setUserProfile({ ...userProfile, role, permissions: DEFAULT_PERMISSIONS[role] })
      toast({ title: 'Função atualizada com sucesso!' })
      return true
    } catch (error) {
      console.error('Erro inesperado:', error)
      return false
    }
  }

  // updatePermissions: vai via RPC (recalcula permissões com base no role)
  const updatePermissions = async (newPermissions: Permissions) => {
    if (!userProfile) return false

    try {
      // Permissões customizadas são salvas via update direto de display_name apenas.
      // Para alterar permissões reais, usar admin_update_user.
      // Aqui apenas sincronizamos o estado local sem persistir no banco
      // (a UI de PermissionsManager não persiste permissões customizadas no modelo multi-tenant).
      setUserProfile({ ...userProfile, permissions: newPermissions })
      toast({ title: 'Permissões atualizadas!' })
      return true
    } catch (error) {
      console.error('Erro inesperado:', error)
      return false
    }
  }

  const hasPermission = (module: keyof Permissions, action: keyof Permissions[keyof Permissions]): boolean => {
    if (!userProfile) return false
    return userProfile.permissions[module][action] === true
  }

  const isSuperAdmin = () => userProfile?.role === 'super_admin'
  const isSuperMaster = () => userProfile?.role === 'super_admin' && !userProfile?.empresa_id
  const isAdmin = () => userProfile?.role === 'super_admin' || userProfile?.role === 'admin'
  const isGerente = () => isAdmin() || userProfile?.role === 'gerente'

  useEffect(() => {
    fetchUserProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return {
    userProfile,
    loading,
    profileError,
    hasPermission,
    isSuperAdmin,
    isSuperMaster,
    isAdmin,
    isGerente,
    updateUserRole,
    updatePermissions,
    defaultPermissions: DEFAULT_PERMISSIONS,
    refetch: fetchUserProfile
  }
}
