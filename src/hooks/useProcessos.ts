import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { PLANO_LIMITE_PROCESSOS } from '@/hooks/usePlanLimits'

export interface Cliente {
  id: string
  nome: string
  cpf_cnpj?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
}

export interface Veiculo {
  id: string
  cliente_id: string | null
  marca: string
  modelo: string
  ano?: number | null
  placa: string
  chassi?: string | null
  renavam?: string | null
}

export type ServicoTipo = 'Transferência de Propriedade' | 'Licenciamento Anual' | '2ª Via CRV' | 'Comunicação de Venda' | 'ATPV (Intenção de Venda)' | 'IPVA' | 'Multas' | 'Outros'
export type ProcessoStatus = 'Recebido' | 'Em Conferência' | 'No DETRAN' | 'Aguardando Pagamento' | 'Concluído'

export interface Processo {
  id: string
  numero_protocolo: string
  numero_processo?: string | null
  data_abertura?: string | null
  cliente_id: string
  veiculo_id: string
  loja_id?: string | null
  servico: ServicoTipo
  status: ProcessoStatus
  valor: number
  valor_dut: number
  valor_boleto: number
  prazo?: string | null
  observacoes?: string | null
  documentos_recebidos?: string[] | null
  created_at: string
  updated_at: string
  cliente?: Cliente
  veiculo?: Veiculo
  loja?: { id: string; nome: string } | null
}

export type CreateProcessoData = {
  cliente_id: string
  veiculo_id: string
  loja_id?: string
  numero_processo?: string
  data_abertura?: string
  servico: ServicoTipo
  status?: ProcessoStatus
  valor: number
  valor_dut?: number
  valor_boleto?: number
  prazo?: string
  observacoes?: string
  documentos_recebidos?: string[]
}

export type UpdateProcessoData = {
  cliente_id?: string
  veiculo_id?: string
  loja_id?: string
  numero_processo?: string
  data_abertura?: string
  servico?: ServicoTipo
  status?: ProcessoStatus
  valor?: number
  valor_dut?: number
  valor_boleto?: number
  prazo?: string
  observacoes?: string
  documentos_recebidos?: string[]
}

export const useProcessos = () => {
  const [processos, setProcessos] = useState<Processo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchProcessos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('processos')
        .select(`
          *,
          cliente:clientes(*),
          veiculo:veiculos(*),
          loja:lojas(id, nome)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProcessos(data || [])
    } catch (error) {
      console.error('Erro ao carregar processos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os processos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome')

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const fetchVeiculos = async () => {
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .order('marca, modelo')

      if (error) throw error
      setVeiculos(data || [])
    } catch (error) {
      console.error('Erro ao carregar veículos:', error)
    }
  }

  const createProcesso = async (processoData: CreateProcessoData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // ── Verificar limite de processos do plano ─────────────────────────────
      const { data: sub } = await supabase
        .from('subscribers')
        .select('subscription_tier')
        .eq('email', user.email ?? '')
        .maybeSingle()

      const tier = sub?.subscription_tier ?? 'Freemium'
      const limite = PLANO_LIMITE_PROCESSOS[tier] ?? null   // null = ilimitado

      if (limite !== null) {
        const { data: count } = await supabase
          .rpc('count_processos_mes', { target_user_id: user.id })

        if ((count ?? 0) >= limite) {
          toast({
            title: `Limite do plano ${tier} atingido`,
            description: `Você já criou ${limite} processos este mês. Faça upgrade para continuar.`,
            variant: 'destructive',
          })
          throw new Error('Limite de processos atingido')
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      const dadosNormalizados = {
        ...processoData,
        prazo: processoData.prazo || null,
        data_abertura: processoData.data_abertura || null,
        numero_processo: processoData.numero_processo || null,
        loja_id: processoData.loja_id || null,
        observacoes: processoData.observacoes || null,
        user_id: user.id,
      }

      const { data, error } = await supabase
        .from('processos')
        .insert(dadosNormalizados as any)
        .select(`
          *,
          cliente:clientes(*),
          veiculo:veiculos(*),
          loja:lojas(id, nome)
        `)
        .single()

      if (error) throw error

      // Lançar receita pendente automaticamente no financeiro
      if (data.valor > 0) {
        const veiculo = veiculos.find(v => v.id === processoData.veiculo_id)
        const cliente = clientes.find(c => c.id === processoData.cliente_id)
        const descricao = [
          processoData.servico,
          cliente?.nome,
          veiculo ? `${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}` : null,
        ].filter(Boolean).join(' | ')

        await supabase.from('transacoes_financeiras').insert([{
          tipo: 'receita',
          categoria: 'Serviços Prestados',
          descricao,
          valor: data.valor,
          data_transacao: processoData.data_abertura || new Date().toISOString().split('T')[0],
          processo_id: data.id,
          cliente_id: processoData.cliente_id,
          status: 'pendente',
          user_id: user.id,
        }] as any)
      }

      setProcessos(prev => [data, ...prev])
      toast({
        title: "Sucesso",
        description: "Processo criado com sucesso!",
      })
      return data
    } catch (error) {
      console.error('Erro ao criar processo:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o processo.",
        variant: "destructive",
      })
      throw error
    }
  }

  const updateProcesso = async (id: string, updates: UpdateProcessoData) => {
    try {
      const { data, error } = await supabase
        .from('processos')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          cliente:clientes(*),
          veiculo:veiculos(*),
          loja:lojas(id, nome)
        `)
        .single()

      if (error) throw error

      setProcessos(prev => prev.map(p => p.id === id ? data : p))
      toast({
        title: "Sucesso",
        description: "Processo atualizado com sucesso!",
      })
      return data
    } catch (error) {
      console.error('Erro ao atualizar processo:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o processo.",
        variant: "destructive",
      })
      throw error
    }
  }

  const deleteProcesso = async (id: string) => {
    try {
      const { error } = await supabase
        .from('processos')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProcessos(prev => prev.filter(p => p.id !== id))
      toast({
        title: "Sucesso",
        description: "Processo excluído com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao excluir processo:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o processo.",
        variant: "destructive",
      })
      throw error
    }
  }

  const createCliente = async (cliente: Omit<Cliente, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('clientes')
        .insert([{ ...cliente, user_id: user.id }] as any)
        .select()
        .single()

      if (error) throw error

      setClientes(prev => [...prev, data])
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso!",
      })
      return data
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente.",
        variant: "destructive",
      })
      throw error
    }
  }

  const createVeiculo = async (veiculo: Omit<Veiculo, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('veiculos')
        .insert([{ ...veiculo, user_id: user.id }] as any)
        .select()
        .single()

      if (error) throw error

      setVeiculos(prev => [...prev, data])
      toast({
        title: "Sucesso",
        description: "Veículo criado com sucesso!",
      })
      return data
    } catch (error) {
      console.error('Erro ao criar veículo:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o veículo.",
        variant: "destructive",
      })
      throw error
    }
  }

  useEffect(() => {
    fetchProcessos()
    fetchClientes()
    fetchVeiculos()
  }, [])

  return {
    processos,
    clientes,
    veiculos,
    loading,
    fetchProcessos,
    createProcesso,
    updateProcesso,
    deleteProcesso,
    createCliente,
    createVeiculo,
  }
}