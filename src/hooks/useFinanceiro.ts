import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

export interface TransacaoFinanceira {
  id: string
  tipo: 'receita' | 'despesa'
  categoria: string
  descricao: string
  valor: number
  data_transacao: string
  processo_id?: string
  cliente_id?: string
  cliente_nome?: string
  metodo_pagamento?: string
  status: 'pendente' | 'pago' | 'cancelado'
  observacoes?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface TransacaoFormData {
  tipo: 'receita' | 'despesa'
  categoria: string
  descricao: string
  valor: number
  data_transacao: string
  processo_id?: string
  cliente_id?: string
  metodo_pagamento?: string
  status: 'pendente' | 'pago' | 'cancelado'
  observacoes?: string
}

export interface EstatisticasFinanceiras {
  totalReceitas: number
  totalDespesas: number
  saldoLiquido: number
  receitasPendentes: number
  despesasPendentes: number
  transacoesMes: number
}

export const useFinanceiro = () => {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasFinanceiras>({
    totalReceitas: 0,
    totalDespesas: 0,
    saldoLiquido: 0,
    receitasPendentes: 0,
    despesasPendentes: 0,
    transacoesMes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'all' | 'receita' | 'despesa'>('all')
  const [filtroStatus, setFiltroStatus] = useState<'all' | 'pendente' | 'pago' | 'cancelado'>('all')
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchTransacoes = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select(`*`)
        .eq('user_id', user.id)
        .order('data_transacao', { ascending: false })

      if (error) {
        console.error('Erro ao buscar transações:', error)
        toast({
          title: "Erro ao carregar transações",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      // Buscar nomes dos clientes separadamente
      const transacoesComCliente = await Promise.all(
        (data || []).map(async (transacao) => {
          let cliente_nome = null
          if (transacao.cliente_id) {
            const { data: clienteData } = await supabase
              .from('clientes')
              .select('nome')
              .eq('id', transacao.cliente_id)
              .single()
            cliente_nome = clienteData?.nome || null
          }
          return {
            ...transacao,
            cliente_nome
          } as TransacaoFinanceira
        })
      )

      setTransacoes(transacoesComCliente)
      calcularEstatisticas(transacoesComCliente)
    } catch (error: any) {
      console.error('Erro inesperado:', error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível carregar as transações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calcularEstatisticas = (transacoes: TransacaoFinanceira[]) => {
    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)

    const transacoesPagas = transacoes.filter(t => t.status === 'pago')
    const transacoesMes = transacoes.filter(t => {
      const dataTransacao = new Date(t.data_transacao)
      return dataTransacao >= inicioMes && dataTransacao <= fimMes
    })

    const totalReceitas = transacoesPagas
      .filter(t => t.tipo === 'receita')
      .reduce((acc, t) => acc + Number(t.valor), 0)

    const totalDespesas = transacoesPagas
      .filter(t => t.tipo === 'despesa')
      .reduce((acc, t) => acc + Number(t.valor), 0)

    const receitasPendentes = transacoes
      .filter(t => t.tipo === 'receita' && t.status === 'pendente')
      .reduce((acc, t) => acc + Number(t.valor), 0)

    const despesasPendentes = transacoes
      .filter(t => t.tipo === 'despesa' && t.status === 'pendente')
      .reduce((acc, t) => acc + Number(t.valor), 0)

    setEstatisticas({
      totalReceitas,
      totalDespesas,
      saldoLiquido: totalReceitas - totalDespesas,
      receitasPendentes,
      despesasPendentes,
      transacoesMes: transacoesMes.length,
    })
  }

  const criarTransacao = async (dados: TransacaoFormData) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .insert([{
          ...dados,
          user_id: user.id
        }] as any)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar transação:', error)
        toast({
          title: "Erro ao criar transação",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Transação criada",
        description: "Transação criada com sucesso!",
      })
      
      await fetchTransacoes()
      return { data, error: null }
    } catch (error: any) {
      console.error('Erro inesperado:', error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível criar a transação.",
        variant: "destructive",
      })
      return { error }
    }
  }

  const atualizarTransacao = async (id: string, dados: Partial<TransacaoFormData>) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      // Campos opcionais precisam ser null (não undefined) para limpar vínculos no Supabase
      const dadosNormalizados = {
        ...dados,
        cliente_id: dados.cliente_id !== undefined ? dados.cliente_id : null,
        processo_id: dados.processo_id !== undefined ? dados.processo_id : null,
        metodo_pagamento: dados.metodo_pagamento !== undefined ? dados.metodo_pagamento : null,
      }

      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .update(dadosNormalizados)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar transação:', error)
        toast({
          title: "Erro ao atualizar transação",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Transação atualizada",
        description: "Transação atualizada com sucesso!",
      })
      
      await fetchTransacoes()
      return { data, error: null }
    } catch (error: any) {
      console.error('Erro inesperado:', error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível atualizar a transação.",
        variant: "destructive",
      })
      return { error }
    }
  }

  const excluirTransacao = async (id: string) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao excluir transação:', error)
        toast({
          title: "Erro ao excluir transação",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Transação excluída",
        description: "Transação excluída com sucesso!",
      })
      
      await fetchTransacoes()
      return { error: null }
    } catch (error: any) {
      console.error('Erro inesperado:', error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      })
      return { error }
    }
  }

  const transacoesFiltradas = transacoes.filter(transacao => {
    const matchesSearch = 
      transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transacao.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transacao.cliente_nome && transacao.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTipo = filtroTipo === 'all' || transacao.tipo === filtroTipo
    const matchesStatus = filtroStatus === 'all' || transacao.status === filtroStatus

    return matchesSearch && matchesTipo && matchesStatus
  })

  useEffect(() => {
    fetchTransacoes()
  }, [user])

  return {
    transacoes: transacoesFiltradas,
    estatisticas,
    loading,
    searchTerm,
    setSearchTerm,
    filtroTipo,
    setFiltroTipo,
    filtroStatus,
    setFiltroStatus,
    criarTransacao,
    atualizarTransacao,
    excluirTransacao,
    refetch: fetchTransacoes,
  }
}