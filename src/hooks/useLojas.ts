import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

export interface Loja {
  id: string
  user_id: string
  nome: string
  tipo: string
  cnpj?: string | null
  telefone?: string | null
  email?: string | null
  contato?: string | null
  observacoes?: string | null
  ativo: boolean
  created_at: string
  updated_at: string
  total_processos?: number
}

export interface LojaFormData {
  nome: string
  tipo: string
  cnpj?: string
  telefone?: string
  email?: string
  contato?: string
  observacoes?: string
  ativo: boolean
}

export const TIPOS_LOJA = ['Concessionária', 'Loja', 'Indicador', 'Despachante Parceiro', 'Outro']

export const useLojas = () => {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchLojas = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .eq('user_id', user.id)
        .order('nome', { ascending: true })

      if (error) throw error

      // Buscar total de processos por loja
      const lojasComTotal = await Promise.all(
        (data || []).map(async (loja) => {
          const { count } = await supabase
            .from('processos')
            .select('*', { count: 'exact', head: true })
            .eq('loja_id', loja.id)
          return { ...loja, total_processos: count || 0 }
        })
      )

      setLojas(lojasComTotal)
    } catch (err: any) {
      toast({ title: 'Erro ao carregar lojas', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const criarLoja = async (dados: LojaFormData) => {
    if (!user) return { error: 'Não autenticado' }
    try {
      const { data, error } = await supabase
        .from('lojas')
        .insert([{ ...dados, user_id: user.id }] as any)
        .select()
        .single()

      if (error) throw error
      toast({ title: 'Loja cadastrada com sucesso!' })
      await fetchLojas()
      return { data, error: null }
    } catch (err: any) {
      toast({ title: 'Erro ao cadastrar loja', description: err.message, variant: 'destructive' })
      return { error: err }
    }
  }

  const atualizarLoja = async (id: string, dados: Partial<LojaFormData>) => {
    if (!user) return { error: 'Não autenticado' }
    try {
      const { data, error } = await supabase
        .from('lojas')
        .update({ ...dados, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      toast({ title: 'Loja atualizada com sucesso!' })
      await fetchLojas()
      return { data, error: null }
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar loja', description: err.message, variant: 'destructive' })
      return { error: err }
    }
  }

  const excluirLoja = async (id: string) => {
    if (!user) return { error: 'Não autenticado' }
    try {
      const { error } = await supabase
        .from('lojas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      toast({ title: 'Loja removida com sucesso!' })
      await fetchLojas()
      return { error: null }
    } catch (err: any) {
      toast({ title: 'Erro ao remover loja', description: err.message, variant: 'destructive' })
      return { error: err }
    }
  }

  const lojasFiltradas = lojas.filter(l =>
    l.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.contato && l.contato.toLowerCase().includes(searchTerm.toLowerCase())) ||
    l.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => { fetchLojas() }, [user])

  return {
    lojas: lojasFiltradas,
    loading,
    searchTerm,
    setSearchTerm,
    criarLoja,
    atualizarLoja,
    excluirLoja,
    refetch: fetchLojas,
  }
}
