import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Eye, Store } from "lucide-react"
import { type Processo } from "@/hooks/useProcessos"

interface ProcessoCardProps {
  processo: Processo
  onEdit: (processo: Processo) => void
  onDelete: (id: string) => void
  onView: (processo: Processo) => void
  onStatusChange: (id: string, newStatus: Processo['status']) => void
  isDragging?: boolean
}

export const ProcessoCard = ({ 
  processo, 
  onEdit, 
  onDelete, 
  onView, 
  onStatusChange,
  isDragging = false 
}: ProcessoCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Recebido": return "bg-blue-100 text-blue-800 border-blue-200"
      case "Em Conferência": return "bg-yellow-100 text-yellow-800 border-yellow-200" 
      case "No DETRAN": return "bg-purple-100 text-purple-800 border-purple-200"
      case "Aguardando Pagamento": return "bg-orange-100 text-orange-800 border-orange-200"
      case "Concluído": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const isPrazoVencido = () => {
    const hoje = new Date()
    const prazo = new Date(processo.prazo ?? '')
    return prazo < hoje && processo.status !== 'Concluído'
  }

  const isDraggable = true // Pode ser baseado em permissões

  return (
    <Card 
      className={`
        cursor-pointer transition-all duration-200 border-l-4 
        ${isDragging ? 'opacity-50 transform rotate-2' : 'hover:shadow-md'} 
        ${isPrazoVencido() ? 'border-l-red-500 bg-red-50/30' : 'border-l-primary'}
      `}
      draggable={isDraggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          id: processo.id,
          currentStatus: processo.status
        }))
      }}
      onClick={() => onView(processo)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header com cliente e protocolo */}
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">
                {processo.cliente?.nome || 'Cliente não encontrado'}
              </p>
              <p className="text-xs text-muted-foreground">
                #{processo.numero_protocolo}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              {isPrazoVencido() && (
                <Badge variant="destructive" className="text-xs px-2 py-1">
                  Vencido
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onView(processo)
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation()
                    onEdit(processo)
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(processo.id)
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Informações do veículo */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {processo.veiculo ?
                `${processo.veiculo.marca} ${processo.veiculo.modelo} - ${processo.veiculo.placa}` :
                'Veículo não encontrado'
              }
            </p>
            <p className="text-sm font-medium text-primary">
              {processo.servico}
            </p>
            {processo.loja && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Store className="h-3 w-3 shrink-0" />
                <span className="truncate">{processo.loja.nome}</span>
              </div>
            )}
          </div>

          {/* Status badge */}
          <div className="flex justify-center">
            <Badge className={`text-xs px-3 py-1 ${getStatusColor(processo.status)}`}>
              {processo.status}
            </Badge>
          </div>

          {/* Footer com valor e prazo */}
          <div className="flex justify-between items-center pt-2 border-t border-border/30">
            <span className="text-sm font-medium text-success">
              {formatCurrency(processo.valor)}
            </span>
            <span className={`text-xs ${isPrazoVencido() ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              {formatDate(processo.prazo ?? '')}
            </span>
          </div>

          {/* DUT / Boleto */}
          {((processo.valor_dut ?? 0) > 0 || (processo.valor_boleto ?? 0) > 0) && (
            <div className="flex gap-2 text-xs text-muted-foreground">
              {(processo.valor_dut ?? 0) > 0 && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                  DUT {formatCurrency(processo.valor_dut)}
                </span>
              )}
              {(processo.valor_boleto ?? 0) > 0 && (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5">
                  Boleto {formatCurrency(processo.valor_boleto)}
                </span>
              )}
            </div>
          )}

          {/* Documentos recebidos - indicador visual */}
          {processo.documentos_recebidos && processo.documentos_recebidos.length > 0 && (
            <div className="flex items-center justify-center pt-1">
              <Badge variant="outline" className="text-xs">
                {processo.documentos_recebidos.length} doc(s)
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}