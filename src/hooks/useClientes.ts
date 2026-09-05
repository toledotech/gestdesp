import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Cliente {
  id: string
  nome: string
  cpf_cnpj?: string | null
  email?: string | null
  telefone?: string | null
  endereco?: string | null
  cep?: string | null
  cidade?: string | null
  uf?: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface CreateClienteData {
  nome: string
  cpf_cnpj?: string
  email?: string
  telefone?: string
  endereco?: string
  cep?: string
  cidade?: string
  uf?: string
}

export interface UpdateClienteData extends CreateClienteData {
  id: string
}

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createCliente = async (clienteData: CreateClienteData) => {
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('Usuário não encontrado')

      const { data, error } = await supabase
        .from('clientes')
        .insert([{ ...clienteData, user_id: user.data.user.id }] as any)
        .select()
        .single()

      if (error) throw error

      setClientes(prev => [...prev, data])
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso",
      })

      return data
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente",
        variant: "destructive"
      })
      throw error
    }
  }

  const updateCliente = async (clienteData: UpdateClienteData) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({
          nome: clienteData.nome,
          cpf_cnpj: clienteData.cpf_cnpj,
          email: clienteData.email,
          telefone: clienteData.telefone,
          endereco: clienteData.endereco,
          cep: clienteData.cep,
          cidade: clienteData.cidade,
          uf: clienteData.uf,
        })
        .eq('id', clienteData.id)
        .select()
        .single()

      if (error) throw error

      setClientes(prev => prev.map(cliente => 
        cliente.id === clienteData.id ? data : cliente
      ))

      toast({
        title: "Sucesso",
        description: "Cliente atualizado com sucesso",
      })

      return data
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteCliente = async (clienteId: string) => {
    try {
      // Verificar se cliente tem processos associados
      const { data: processos, error: processosError } = await supabase
        .from('processos')
        .select('id')
        .eq('cliente_id', clienteId)
        .limit(1)

      if (processosError) throw processosError

      if (processos && processos.length > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir um cliente que possui processos associados",
          variant: "destructive"
        })
        return
      }

      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId)

      if (error) throw error

      setClientes(prev => prev.filter(cliente => cliente.id !== clienteId))
      
      toast({
        title: "Sucesso",
        description: "Cliente excluído com sucesso",
      })
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cliente",
        variant: "destructive"
      })
    }
  }

  const getClientesStats = () => {
    const total = clientes.length
    const comEmail = clientes.filter(c => c.email && c.email.trim() !== '').length
    const comTelefone = clientes.filter(c => c.telefone && c.telefone.trim() !== '').length
    const comEndereco = clientes.filter(c => c.endereco && c.endereco.trim() !== '').length

    return {
      total,
      comEmail,
      comTelefone,
      comEndereco,
      percentualCompleto: total > 0 ? Math.round((comEmail + comTelefone + comEndereco) / (total * 3) * 100) : 0
    }
  }

  const getFilteredClientes = () => {
    if (!searchTerm.trim()) return clientes

    const term = searchTerm.toLowerCase()
    return clientes.filter(cliente =>
      cliente.nome.toLowerCase().includes(term) ||
      cliente.cpf_cnpj?.toLowerCase().includes(term) ||
      cliente.email?.toLowerCase().includes(term) ||
      cliente.telefone?.toLowerCase().includes(term)
    )
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  return {
    clientes: getFilteredClientes(),
    allClientes: clientes,
    loading,
    searchTerm,
    setSearchTerm,
    stats: getClientesStats(),
    createCliente,
    updateCliente,
    deleteCliente,
    refetch: fetchClientes
  }
}