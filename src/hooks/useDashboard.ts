import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ProcessoStatus } from './useProcessos'

export interface DashboardStats {
  processosCriticos: number
  processosAtivos: number
  agendaHoje: number
  receitaMensal: number
  processosRecentes: Array<{
    id: string
    cliente_nome: string
    servico: string
    prazo: string | null
    status: ProcessoStatus
    vencido: boolean
  }>
  agendaItems: Array<{
    horario: string
    cliente: string
    tipo: string
    status: 'agendado' | 'em-andamento' | 'concluido'
  }>
  statusCount: Record<ProcessoStatus, number>
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    processosCriticos: 0,
    processosAtivos: 0,
    agendaHoje: 0,
    receitaMensal: 0,
    processosRecentes: [],
    agendaItems: [],
    statusCount: {
      'Recebido': 0,
      'Em Conferência': 0,
      'No DETRAN': 0,
      'Aguardando Pagamento': 0,
      'Concluído': 0,
    }
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Buscar todos os processos com clientes
      const { data: processos, error: processosError } = await supabase
        .from('processos')
        .select(`
          *,
          cliente:clientes(nome)
        `)
        .order('created_at', { ascending: false })

      if (processosError) throw processosError

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const amanha = new Date(hoje)
      amanha.setDate(amanha.getDate() + 1)

      // Calcular estatísticas
      const processosArray = processos || []
      
      // Processos críticos (prazo hoje ou vencido)
      const processosCriticos = processosArray.filter(p => {
        const prazo = new Date(p.prazo ?? '')
        return prazo <= amanha && p.status !== 'Concluído'
      }).length

      // Processos ativos (não concluídos)
      const processosAtivos = processosArray.filter(p => p.status !== 'Concluído').length

      // Receita mensal (soma dos valores dos processos do mês atual)
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const receitaMensal = processosArray
        .filter(p => new Date(p.created_at) >= inicioMes)
        .reduce((acc, p) => acc + (p.valor || 0), 0)

      // Processos recentes para timeline
      const processosRecentes = processosArray.slice(0, 5).map(p => ({
        id: p.id,
        cliente_nome: p.cliente?.nome || 'Cliente não informado',
        servico: p.servico,
        prazo: p.prazo,
        status: p.status,
        vencido: new Date(p.prazo ?? '') < hoje && p.status !== 'Concluído'
      }))

      // Contagem por status
      const statusCount = processosArray.reduce((acc, p) => {
        acc[p.status as ProcessoStatus] = (acc[p.status as ProcessoStatus] || 0) + 1
        return acc
      }, {
        'Recebido': 0,
        'Em Conferência': 0,
        'No DETRAN': 0,
        'Aguardando Pagamento': 0,
        'Concluído': 0,
      })

      // Agenda baseada nos processos críticos
      const agendaItems = processosRecentes.slice(0, 2).map(p => ({
        horario: "A definir",
        cliente: p.cliente_nome,
        tipo: p.servico,
        status: "agendado" as const
      }))

      setStats({
        processosCriticos,
        processosAtivos,
        agendaHoje: agendaItems.length,
        receitaMensal,
        processosRecentes,
        agendaItems,
        statusCount,
      })

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    stats,
    loading,
    refetch: fetchDashboardData,
  }
}