import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from './use-toast'
import { format } from 'date-fns'

export interface Compromisso {
  id: string
  titulo: string
  descricao?: string | null
  data_hora: string
  cliente_id?: string | null
  cliente?: { nome: string } | null
  tipo: string
  status: string
  created_at: string
}

export type CreateCompromissoData = {
  titulo: string
  descricao?: string
  data_hora: string
  cliente_id?: string
  tipo: string
}

export const useCompromissos = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [compromissos, setCompromissos] = useState<Compromisso[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompromissos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('compromissos')
        .select('*, cliente:clientes(nome)')
        .order('data_hora', { ascending: true })

      if (error) throw error
      setCompromissos(data || [])
    } catch (error) {
      console.error('Erro ao buscar compromissos:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCompromisso = async (dados: CreateCompromissoData) => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('compromissos')
        .insert([{ ...dados, user_id: user.id }] as any)
        .select('*, cliente:clientes(nome)')
        .single()

      if (error) throw error

      setCompromissos(prev =>
        [...prev, data].sort((a, b) => a.data_hora.localeCompare(b.data_hora))
      )
      toast({ title: 'Compromisso agendado!' })
      return data
    } catch (error) {
      console.error('Erro ao criar compromisso:', error)
      toast({ title: 'Erro', description: 'Não foi possível criar o compromisso.', variant: 'destructive' })
      throw error
    }
  }

  const updateCompromisso = async (
    id: string,
    updates: Partial<CreateCompromissoData> & { status?: string }
  ) => {
    try {
      const { data, error } = await supabase
        .from('compromissos')
        .update(updates)
        .eq('id', id)
        .select('*, cliente:clientes(nome)')
        .single()

      if (error) throw error

      setCompromissos(prev => prev.map(c => (c.id === id ? data : c)))
      toast({ title: 'Compromisso atualizado!' })
      return data
    } catch (error) {
      console.error('Erro ao atualizar compromisso:', error)
      toast({ title: 'Erro', description: 'Não foi possível atualizar o compromisso.', variant: 'destructive' })
      throw error
    }
  }

  const deleteCompromisso = async (id: string) => {
    try {
      const { error } = await supabase.from('compromissos').delete().eq('id', id)
      if (error) throw error
      setCompromissos(prev => prev.filter(c => c.id !== id))
      toast({ title: 'Compromisso removido.' })
    } catch (error) {
      console.error('Erro ao excluir compromisso:', error)
      toast({ title: 'Erro', description: 'Não foi possível remover o compromisso.', variant: 'destructive' })
      throw error
    }
  }

  const concluirCompromisso = (id: string) =>
    updateCompromisso(id, { status: 'concluido' })

  const getCompromissosForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return compromissos.filter(c => c.data_hora.startsWith(dateStr))
  }

  /** Datas que têm pelo menos um compromisso — para destacar no calendário */
  const datasComCompromisso = compromissos.map(c => new Date(c.data_hora))

  useEffect(() => {
    fetchCompromissos()
  }, [user])

  return {
    compromissos,
    loading,
    fetchCompromissos,
    createCompromisso,
    updateCompromisso,
    deleteCompromisso,
    concluirCompromisso,
    getCompromissosForDate,
    datasComCompromisso,
  }
}
