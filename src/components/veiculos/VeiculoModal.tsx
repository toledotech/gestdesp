import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Veiculo, VeiculoFormData } from "@/hooks/useVeiculos"
import { useClientes } from "@/hooks/useClientes"

interface VeiculoModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (dados: VeiculoFormData) => Promise<{ error: any } | { data: any; error: null }>
  veiculo?: Veiculo | null
  mode: 'create' | 'edit'
}

export const VeiculoModal = ({ isOpen, onClose, onSave, veiculo, mode }: VeiculoModalProps) => {
  const [formData, setFormData] = useState<VeiculoFormData>({
    placa: '',
    marca: '',
    modelo: '',
    ano: undefined,
    chassi: '',
    renavam: '',
    cliente_id: undefined,
  })
  const [loading, setLoading] = useState(false)
  const { clientes } = useClientes()

  useEffect(() => {
    if (mode === 'edit' && veiculo) {
      setFormData({
        placa: veiculo.placa,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano ?? undefined,
        chassi: veiculo.chassi || '',
        renavam: veiculo.renavam || '',
        cliente_id: veiculo.cliente_id || undefined,
      })
    } else {
      setFormData({
        placa: '',
        marca: '',
        modelo: '',
        ano: undefined,
        chassi: '',
        renavam: '',
        cliente_id: undefined,
      })
    }
  }, [mode, veiculo, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dadosParaSalvar = {
        ...formData,
        chassi: formData.chassi || undefined,
        renavam: formData.renavam || undefined,
        cliente_id: formData.cliente_id || undefined,
      }

      const result = await onSave(dadosParaSalvar)
      
      if (!result.error) {
        onClose()
      }
    } catch (error) {
      console.error('Erro ao salvar veículo:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPlaca = (value: string) => {
    // Remove tudo que não for letra ou número
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    // Formato antigo: ABC1234 ou novo: ABC1D23
    if (clean.length <= 7) {
      if (clean.length <= 3) {
        return clean
      } else if (clean.length <= 7) {
        return clean.slice(0, 3) + '-' + clean.slice(3)
      }
    }
    
    return clean.slice(0, 7)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo Veículo' : 'Editar Veículo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="placa">Placa *</Label>
              <Input
                id="placa"
                value={formData.placa}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  placa: formatPlaca(e.target.value)
                }))}
                placeholder="ABC-1234"
                required
                maxLength={8}
              />
            </div>

            <div>
              <Label htmlFor="marca">Marca *</Label>
              <Input
                id="marca"
                value={formData.marca}
                onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                placeholder="Toyota, Honda, Ford..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                placeholder="Corolla, Civic, Focus..."
                required
              />
            </div>

            <div>
              <Label htmlFor="ano">Ano</Label>
              <Input
                id="ano"
                type="number"
                value={formData.ano || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  ano: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                placeholder="2023"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cliente_id">Cliente</Label>
            <Select
              value={formData.cliente_id || "none"}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                cliente_id: value === "none" ? undefined : value
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum cliente</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="chassi">Chassi</Label>
              <Input
                id="chassi"
                value={formData.chassi}
                onChange={(e) => setFormData(prev => ({ ...prev, chassi: e.target.value }))}
                placeholder="Número do chassi"
                maxLength={17}
              />
            </div>

            <div>
              <Label htmlFor="renavam">Renavam</Label>
              <Input
                id="renavam"
                value={formData.renavam}
                onChange={(e) => setFormData(prev => ({ ...prev, renavam: e.target.value }))}
                placeholder="Número do Renavam"
                maxLength={11}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : mode === 'create' ? 'Criar Veículo' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}