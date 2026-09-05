import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from '@/hooks/use-toast'
import { Database } from '@/integrations/supabase/types'

type ConfiguracoesEmpresaRow = Database['public']['Tables']['configuracoes_empresa']['Row']
type ConfiguracoesEmpresaInsert = Database['public']['Tables']['configuracoes_empresa']['Insert']

export interface ConfiguracoesEmpresa {
  id?: string
  user_id: string
  nome_empresa: string
  cnpj?: string | null
  razao_social?: string | null
  inscricao_estadual?: string | null
  inscricao_municipal?: string | null
  endereco?: string | null
  cidade?: string | null
  estado?: string | null
  cep?: string | null
  telefone?: string | null
  celular?: string | null
  email?: string | null
  site?: string | null
  logo_url?: string | null
  cor_tema: string | null
  configuracoes_notificacao: {
    email_processos: boolean
    email_prazos: boolean
    sms_urgentes: boolean
  }
  configuracoes_sistema: {
    auto_backup: boolean
    relatorio_mensal: boolean
    dashboard_inicial: string
  }
  created_at?: string
  updated_at?: string
}

export const useConfiguracoes = () => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesEmpresa | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchConfiguracoes = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('configuracoes_empresa')
        .select('*')
        .maybeSingle()

      if (error) throw error

      if (data) {
        const mappedData: ConfiguracoesEmpresa = {
          ...data,
          configuracoes_notificacao: data.configuracoes_notificacao as any,
          configuracoes_sistema: data.configuracoes_sistema as any,
        }
        setConfiguracoes(mappedData)
      } else {
        setConfiguracoes(null)
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações da empresa",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const salvarConfiguracoes = async (dados: Partial<ConfiguracoesEmpresa>) => {
    if (!user) return

    try {
      const dadosFormatados: ConfiguracoesEmpresaInsert = {
        user_id: user.id,
        nome_empresa: dados.nome_empresa || '',
        cnpj: dados.cnpj || null,
        razao_social: dados.razao_social || null,
        inscricao_estadual: dados.inscricao_estadual || null,
        inscricao_municipal: dados.inscricao_municipal || null,
        endereco: dados.endereco || null,
        cidade: dados.cidade || null,
        estado: dados.estado || null,
        cep: dados.cep || null,
        telefone: dados.telefone || null,
        celular: dados.celular || null,
        email: dados.email || null,
        site: dados.site || null,
        logo_url: dados.logo_url || null,
        cor_tema: dados.cor_tema || '#2563eb',
        configuracoes_notificacao: dados.configuracoes_notificacao as any,
        configuracoes_sistema: dados.configuracoes_sistema as any,
      }

      const { data, error } = await supabase
        .from('configuracoes_empresa')
        .upsert(dadosFormatados as any, { onConflict: 'empresa_id' })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const mappedData: ConfiguracoesEmpresa = {
          ...data,
          configuracoes_notificacao: data.configuracoes_notificacao as any,
          configuracoes_sistema: data.configuracoes_sistema as any,
        }
        setConfiguracoes(mappedData)
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      })

      return data
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      })
      throw error
    }
  }

  const uploadLogo = async (file: File) => {
    if (!user) return null

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/logo.${fileExt}`

      // Remove logo anterior se existir
      await supabase.storage
        .from('logos-empresa')
        .remove([fileName])

      // Upload novo logo
      const { error: uploadError } = await supabase.storage
        .from('logos-empresa')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('logos-empresa')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error)
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do logo",
        variant: "destructive"
      })
      return null
    }
  }

  useEffect(() => {
    fetchConfiguracoes()
  }, [user])

  return {
    configuracoes,
    loading,
    salvarConfiguracoes,
    uploadLogo,
    refetch: fetchConfiguracoes
  }
}