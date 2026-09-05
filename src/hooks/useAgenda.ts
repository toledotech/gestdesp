import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { differenceInDays, format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface AgendaItem {
  id: string
  numeroProtocolo: string
  prazo: string
  clienteNome: string
  veiculoPlaca: string
  servico: string
  status: string
  valor: number
  diasRestantes: number
  isCritico: boolean
  observacoes?: string
}

export interface AgendaStats {
  totalPrazos: number
  prazosCriticos: number
  prazosVencidos: number
  prazosHoje: number
}

export function useAgenda() {
  const [items, setItems] = useState<AgendaItem[]>([])
  const [stats, setStats] = useState<AgendaStats>({
    totalPrazos: 0,
    prazosCriticos: 0,
    prazosVencidos: 0,
    prazosHoje: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { toast } = useToast()
  // Evita toasts de alerta repetidos a cada refresh automático (30 min)
  const alertasCriticosExibidosRef = useRef(false)

  const fetchAgendaItems = async () => {
    try {
      setLoading(true)
      
      const { data: processos, error } = await supabase
        .from('processos')
        .select(`
          id,
          numero_protocolo,
          prazo,
          status,
          servico,
          valor,
          observacoes,
          clientes (nome),
          veiculos (placa)
        `)
        .order('prazo', { ascending: true })

      if (error) throw error

      const hoje = new Date()
      const agendaItems: AgendaItem[] = []
      let prazosCriticos = 0
      let prazosVencidos = 0
      let prazosHoje = 0

      processos?.forEach((processo) => {
        const prazoDifference = differenceInDays(parseISO(processo.prazo ?? ''), hoje)
        const isCritico = prazoDifference <= 3 && prazoDifference >= 0
        const isVencido = prazoDifference < 0
        const isHoje = prazoDifference === 0

        if (isCritico) prazosCriticos++
        if (isVencido) prazosVencidos++
        if (isHoje) prazosHoje++

        agendaItems.push({
          id: processo.id,
          numeroProtocolo: processo.numero_protocolo,
          prazo: processo.prazo ?? '',
          clienteNome: processo.clientes?.nome || 'Cliente não informado',
          veiculoPlaca: processo.veiculos?.placa || 'Placa não informada',
          servico: processo.servico,
          status: processo.status,
          valor: Number(processo.valor),
          diasRestantes: prazoDifference,
          isCritico,
          observacoes: processo.observacoes ?? undefined
        })
      })

      setItems(agendaItems)
      setStats({
        totalPrazos: agendaItems.length,
        prazosCriticos,
        prazosVencidos,
        prazosHoje
      })

      // Emitir notificações para prazos críticos
      emitirNotificacoesCriticas(agendaItems.filter(item => item.isCritico || item.diasRestantes < 0))

    } catch (error) {
      console.error('Erro ao buscar agenda:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar a agenda",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const emitirNotificacoesCriticas = (itensCriticos: AgendaItem[]) => {
    // Emite alertas apenas uma vez por sessão para não poluir o usuário com toasts repetidos
    if (itensCriticos.length === 0 || alertasCriticosExibidosRef.current) return
    alertasCriticosExibidosRef.current = true

    const vencidos = itensCriticos.filter(item => item.diasRestantes < 0)
    const criticos = itensCriticos.filter(item => item.diasRestantes >= 0 && item.diasRestantes <= 3)

    if (vencidos.length > 0) {
      toast({
        title: "⚠️ Prazos Vencidos!",
        description: `${vencidos.length} processo(s) com prazo vencido precisam de atenção urgente`,
        variant: "destructive"
      })
    }

    if (criticos.length > 0) {
      toast({
        title: "🔔 Prazos Críticos",
        description: `${criticos.length} processo(s) vencem nos próximos 3 dias`,
        variant: "default"
      })
    }
  }

  const getItemsForDate = (date: Date) => {
    return items.filter(item => {
      const itemDate = parseISO(item.prazo)
      return format(itemDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    })
  }

  const getItemsForDateRange = (startDate: Date, endDate: Date) => {
    return items.filter(item => {
      const itemDate = parseISO(item.prazo)
      return isWithinInterval(itemDate, { start: startOfDay(startDate), end: endOfDay(endDate) })
    })
  }

  const getFilteredItems = () => {
    if (statusFilter === 'all') return items
    return items.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase())
  }

  useEffect(() => {
    fetchAgendaItems()
    
    // Configurar intervalo para verificar prazos críticos a cada 30 minutos
    const interval = setInterval(() => {
      fetchAgendaItems()
    }, 30 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    items: getFilteredItems(),
    stats,
    loading,
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    getItemsForDate,
    getItemsForDateRange,
    refetch: fetchAgendaItems
  }
}