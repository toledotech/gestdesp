import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

export type TipoCredito = 'credito' | 'debito'

export interface CreditoLoja {
  id: string
  user_id: string
  loja_id: string
  processo_id?: string | null
  tipo: TipoCredito
  descricao: string
  valor: number
  data: string
  created_at: string
  processo?: { numero_protocolo: string } | null
}

export interface CreditoLojaFormData {
  tipo: TipoCredito
  descricao: string
  valor: number
  data: string
  processo_id?: string
}

const formVazio: CreditoLojaFormData = {
  tipo: 'credito',
  descricao: '',
  valor: 0,
  data: new Date().toISOString().split('T')[0],
  processo_id: undefined,
}

export const useCreditosLoja = (loja_id?: string) => {
  const [lancamentos, setLancamentos] = useState<CreditoLoja[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchLancamentos = async () => {
    if (!user || !loja_id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('creditos_lojas')
        .select(`
          *,
          processo:processos(numero_protocolo)
        `)
        .eq('user_id', user.id)
        .eq('loja_id', loja_id)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setLancamentos((data || []) as CreditoLoja[])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar lançamentos', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const criarLancamento = async (dados: CreditoLojaFormData) => {
    if (!user || !loja_id) return { error: 'Não autenticado' }
    try {
      const { data, error } = await supabase
        .from('creditos_lojas')
        .insert([{
          ...dados,
          loja_id,
          user_id: user.id,
          processo_id: dados.processo_id || null,
        }] as any)
        .select()
        .single()

      if (error) throw error
      toast({ title: 'Lançamento registrado com sucesso!' })
      await fetchLancamentos()
      return { data, error: null }
    } catch (err: any) {
      toast({ title: 'Erro ao registrar lançamento', description: err.message, variant: 'destructive' })
      return { error: err }
    }
  }

  const excluirLancamento = async (id: string) => {
    if (!user) return { error: 'Não autenticado' }
    try {
      const { error } = await supabase
        .from('creditos_lojas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      toast({ title: 'Lançamento removido!' })
      await fetchLancamentos()
      return { error: null }
    } catch (err: any) {
      toast({ title: 'Erro ao remover lançamento', description: err.message, variant: 'destructive' })
      return { error: err }
    }
  }

  // Saldo: positivo = despachante deve à loja | negativo = loja deve ao despachante
  const saldo = lancamentos.reduce((acc, l) => {
    return l.tipo === 'credito' ? acc + l.valor : acc - l.valor
  }, 0)

  const totalCreditos = lancamentos.filter(l => l.tipo === 'credito').reduce((s, l) => s + l.valor, 0)
  const totalDebitos  = lancamentos.filter(l => l.tipo === 'debito').reduce((s, l) => s + l.valor, 0)

  useEffect(() => { fetchLancamentos() }, [user, loja_id])

  return {
    lancamentos,
    loading,
    saldo,
    totalCreditos,
    totalDebitos,
    formVazio,
    criarLancamento,
    excluirLancamento,
    refetch: fetchLancamentos,
  }
}

// ─── Hook para saldos de todas as lojas de uma vez ────────────────────────────
export const useSaldosLojas = () => {
  const [saldos, setSaldos] = useState<Record<string, number>>({})
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    const fetchSaldos = async () => {
      const { data } = await supabase
        .from('creditos_lojas')
        .select('loja_id, tipo, valor')
        .eq('user_id', user.id)

      const mapa: Record<string, number> = {}
      for (const row of data || []) {
        if (!mapa[row.loja_id]) mapa[row.loja_id] = 0
        mapa[row.loja_id] += row.tipo === 'credito' ? row.valor : -row.valor
      }
      setSaldos(mapa)
    }
    fetchSaldos()
  }, [user])

  return { saldos }
}
