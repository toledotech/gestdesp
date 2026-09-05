import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

export interface Veiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  ano?: number | null
  chassi?: string | null
  renavam?: string | null
  cliente_id?: string | null
  cliente_nome?: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface VeiculoFormData {
  placa: string
  marca: string
  modelo: string
  ano?: number
  chassi?: string
  renavam?: string
  cliente_id?: string
}

export const useVeiculos = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchVeiculos = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('veiculos')
        .select(`
          *,
          clientes!veiculos_cliente_id_fkey (
            nome
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar veículos:', error)
        toast({
          title: "Erro ao carregar veículos",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      const veiculosComCliente = data?.map(veiculo => ({
        ...veiculo,
        cliente_nome: veiculo.clientes?.nome || null
      })) || []

      setVeiculos(veiculosComCliente)
    } catch (error: any) {
      console.error('Erro inesperado:', error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível carregar os veículos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const criarVeiculo = async (dados: VeiculoFormData) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      const { data, error } = await supabase
        .from('veiculos')
        .insert([{
          ...dados,
          user_id: user.id
        }] as any)
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar veículo:', error)
        toast({
          title: "Erro ao criar veículo",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Veículo criado",
        description: "Veículo criado com sucesso!",
      })
      
      await fetchVeiculos()
      return { data, error: null }
    } catch (error: any) {
      console.error('Erro inesperado:', error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível criar o veículo.",
        variant: "destructive",
      })
      return { error }
    }
  }

  const atualizarVeiculo = async (id: string, dados: Partial<VeiculoFormData>) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      // cliente_id precisa ser null (não undefined) para limpar o vínculo no Supabase
      const dadosNormalizados = {
        ...dados,
        cliente_id: dados.cliente_id !== undefined ? dados.cliente_id : null,
      }

      const { data, error } = await supabase
        .from('veiculos')
        .update(dadosNormalizados)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar veículo:', error)
        toast({
          title: "Erro ao atualizar veículo",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Veículo atualizado",
        description: "Veículo atualizado com sucesso!",
      })
      
      await fetchVeiculos()
      return { data, error: null }
    } catch (error: any) {
      console.error('Erro inesperado:', error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível atualizar o veículo.",
        variant: "destructive",
      })
      return { error }
    }
  }

  const excluirVeiculo = async (id: string) => {
    if (!user) return { error: 'Usuário não autenticado' }

    try {
      // Verificar se o veículo está sendo usado em processos
      const { data: processosRelacionados, error: checkError } = await supabase
        .from('processos')
        .select('id')
        .eq('veiculo_id', id)
        .eq('user_id', user.id)

      if (checkError) {
        console.error('Erro ao verificar processos:', checkError)
        toast({
          title: "Erro ao verificar dependências",
          description: checkError.message,
          variant: "destructive",
        })
        return { error: checkError }
      }

      if (processosRelacionados && processosRelacionados.length > 0) {
        toast({
          title: "Não é possível excluir",
          description: "Este veículo possui processos vinculados. Remova os processos primeiro.",
          variant: "destructive",
        })
        return { error: { message: 'Veículo possui processos vinculados' } }
      }

      const { error } = await supabase
        .from('veiculos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao excluir veículo:', error)
        toast({
          title: "Erro ao excluir veículo",
          description: error.message,
          variant: "destructive",
        })
        return { error }
      }

      toast({
        title: "Veículo excluído",
        description: "Veículo excluído com sucesso!",
      })
      
      await fetchVeiculos()
      return { error: null }
    } catch (error: any) {
      console.error('Erro inesperado:', error)
      toast({
        title: "Erro inesperado",
        description: "Não foi possível excluir o veículo.",
        variant: "destructive",
      })
      return { error }
    }
  }

  const veiculosFiltrados = veiculos.filter(veiculo =>
    veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (veiculo.cliente_nome && veiculo.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  useEffect(() => {
    fetchVeiculos()
  }, [user])

  return {
    veiculos: veiculosFiltrados,
    loading,
    searchTerm,
    setSearchTerm,
    criarVeiculo,
    atualizarVeiculo,
    excluirVeiculo,
    refetch: fetchVeiculos,
  }
}