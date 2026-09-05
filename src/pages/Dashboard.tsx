import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Loader2
} from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"
import { useNavigate } from "@tanstack/react-router"

const Dashboard = () => {
  const { stats, loading } = useDashboard()
  const navigate = useNavigate()
  
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground capitalize">{currentDate}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-hover transition-all duration-300 border-l-4 border-l-warning bg-gradient-to-br from-card to-warning-light/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prazos Críticos</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.processosCriticos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.processosCriticos > 0 ? 'requerem atenção' : 'todos em dia'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-all duration-300 border-l-4 border-l-primary bg-gradient-to-br from-card to-primary-light/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.processosAtivos}</div>
            <p className="text-xs text-muted-foreground">
              {stats.processosAtivos > 0 ? 'em andamento' : 'nenhum ativo'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-all duration-300 border-l-4 border-l-success bg-gradient-to-br from-card to-success-light/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agenda Hoje</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <Calendar className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.agendaHoje}</div>
            <p className="text-xs text-muted-foreground">
              {stats.agendaHoje > 0 ? 'atendimentos marcados' : 'agenda livre'}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-hover transition-all duration-300 border-l-4 border-l-accent bg-gradient-to-br from-card to-accent-light/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              R$ {stats.receitaMensal.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              receita deste mês
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prazos Críticos */}
        <Card className="border-l-4 border-l-warning bg-gradient-to-br from-card to-warning-light/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              Prazos Críticos do Dia
            </CardTitle>
            <CardDescription>
              Processos que vencem hoje ou já venceram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.processosRecentes.filter(p => p.vencido || new Date(p.prazo ?? "") <= new Date()).slice(0, 3).map((processo, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{processo.cliente_nome}</p>
                  <p className="text-sm text-muted-foreground">{processo.servico}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={processo.vencido ? 'destructive' : 'secondary'}>
                    {processo.vencido ? 'Vencido' : 'Hoje'}
                  </Badge>
                  {processo.vencido ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Clock className="h-4 w-4 text-warning" />
                  )}
                </div>
              </div>
            ))}
            {stats.processosRecentes.filter(p => p.vencido || new Date(p.prazo ?? "") <= new Date()).length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum prazo crítico hoje! 🎉
              </div>
            )}
            <Button className="w-full" variant="outline" onClick={() => navigate({ to: '/prazos' })}>
              Ver Todos os Prazos
            </Button>
          </CardContent>
        </Card>

        {/* Agenda do Dia */}
        <Card className="border-l-4 border-l-primary bg-gradient-to-br from-card to-primary-light/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              Agenda do Dia
            </CardTitle>
            <CardDescription>
              Próximos atendimentos programados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.agendaItems.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-mono font-medium text-primary">
                    {item.horario}
                  </div>
                  <div>
                    <p className="font-medium">{item.cliente}</p>
                    <p className="text-sm text-muted-foreground">{item.tipo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'concluido' && <CheckCircle className="h-4 w-4 text-success" />}
                  {item.status === 'em-andamento' && (
                    <Badge variant="secondary" className="bg-warning text-warning-foreground">
                      Em andamento
                    </Badge>
                  )}
                  {item.status === 'agendado' && (
                    <Badge variant="outline">Agendado</Badge>
                  )}
                </div>
              </div>
            ))}
            {stats.agendaItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum atendimento agendado para hoje
              </div>
            )}
            <Button className="w-full" variant="outline" onClick={() => navigate({ to: '/agenda' })}>
              Ver Agenda Completa
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status dos Processos */}
      <Card className="border-l-4 border-l-accent bg-gradient-to-br from-card to-accent-light/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="h-5 w-5 text-accent" />
            </div>
            Resumo de Processos por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.statusCount).map(([status, count]) => {
              const statusConfig = {
                'Recebido': { color: "text-info", bg: "bg-info-light" },
                'Em Conferência': { color: "text-warning", bg: "bg-warning-light" },
                'No DETRAN': { color: "text-primary", bg: "bg-primary-light" },
                'Aguardando Pagamento': { color: "text-destructive", bg: "bg-destructive-light" },
                'Concluído': { color: "text-success", bg: "bg-success-light" },
              }[status] || { color: "text-foreground", bg: "bg-muted" }

              return (
                <div key={status} className={`text-center p-4 ${statusConfig.bg} border border-border/50 rounded-lg hover:shadow-card transition-all duration-300 hover:scale-105`}>
                  <div className={`text-2xl font-bold ${statusConfig.color}`}>
                    {count}
                  </div>
                  <p className="text-sm font-medium text-foreground/80">{status}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard