import { useNavigate } from "@tanstack/react-router"
import { RelatoriosHeader } from "@/components/relatorios/RelatoriosHeader"
import { ProcessosPeriodoChart } from "@/components/relatorios/ProcessosPeriodoChart"
import { ProcessosPeriodoTable } from "@/components/relatorios/ProcessosPeriodoTable"
import { ProcessosStatusChart } from "@/components/relatorios/ProcessosStatusChart"
import { ProcessosStatusTable } from "@/components/relatorios/ProcessosStatusTable"
import { ProcessosClienteChart } from "@/components/relatorios/ProcessosClienteChart"
import { ProcessosClienteTable } from "@/components/relatorios/ProcessosClienteTable"
import { ProcessosServicoChart } from "@/components/relatorios/ProcessosServicoChart"
import { ProcessosServicoTable } from "@/components/relatorios/ProcessosServicoTable"
import { ControlePrazosChart } from "@/components/relatorios/ControlePrazosChart"
import { ControlePrazosTable } from "@/components/relatorios/ControlePrazosTable"
import { ReceitasDespesasChart } from "@/components/relatorios/ReceitasDespesasChart"
import { ReceitasDespesasTable } from "@/components/relatorios/ReceitasDespesasTable"
import { FluxoCaixaChart } from "@/components/relatorios/FluxoCaixaChart"
import { FluxoCaixaTable } from "@/components/relatorios/FluxoCaixaTable"
import { ProcessosLojaTable } from "@/components/relatorios/ProcessosLojaTable"
import { RelatorioDetalhadoTable } from "@/components/relatorios/RelatorioDetalhadoTable"
import { useRelatorios } from "@/hooks/useRelatorios"
import { usePlanLimits } from "@/hooks/usePlanLimits"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, Loader2, TrendingUp } from "lucide-react"

// ─── Overlay de conteúdo bloqueado ───────────────────────────────────────────

interface BloqueadoProps {
  titulo: string
  planoMinimo: string
}

const RelatorioBloqueado = ({ titulo, planoMinimo }: BloqueadoProps) => {
  const navigate = useNavigate()
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold">{titulo}</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Este relatório está disponível a partir do plano{' '}
            <strong>{planoMinimo}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Badge variant="outline" className="text-muted-foreground">
            Plano atual
          </Badge>
          <span className="text-muted-foreground text-sm">→</span>
          <Badge className="bg-primary">{planoMinimo} ou superior</Badge>
        </div>
        <Button onClick={() => navigate({ to: '/assinatura' })} className="mt-2 gap-2">
          <TrendingUp className="h-4 w-4" />
          Ver planos disponíveis
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

const Relatorios = () => {
  const {
    processosPeriodo,
    processosStatus,
    processosCliente,
    processosServico,
    controlePrazos,
    receitasDespesas,
    fluxoCaixa,
    estatisticasResumo,
    loading,
    filtros,
    updateFiltros,
  } = useRelatorios()

  const { limits } = usePlanLimits()

  // Aba Fluxo de Caixa: disponível no plano Básico+
  const fluxoBloqueado = !limits.relatoriosFluxoCaixa
  // Aba Receitas vs Despesas: disponível no plano Premium+
  const receitasBloqueado = !limits.relatoriosReceitasDespesas

  const handleExport = () => {
    console.log('Exportar dados:', processosPeriodo)
  }

  return (
    <div className="p-6 space-y-6">
      <RelatoriosHeader
        filtros={filtros}
        onUpdateFiltros={updateFiltros}
        estatisticas={estatisticasResumo}
        onExport={handleExport}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando relatório...</span>
        </div>
      ) : (
        <Tabs defaultValue="periodo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            {/* ── Abas básicas (todos os planos) ── */}
            <TabsTrigger value="periodo">Por Período</TabsTrigger>
            <TabsTrigger value="status">Por Status</TabsTrigger>
            <TabsTrigger value="cliente">Por Cliente</TabsTrigger>
            <TabsTrigger value="servico">Por Serviço</TabsTrigger>
            <TabsTrigger value="prazos">Prazos</TabsTrigger>
            <TabsTrigger value="loja">Por Loja</TabsTrigger>

            {/* ── Aba Detalhado (todos os planos) ── */}
            <TabsTrigger value="detalhado">Detalhado</TabsTrigger>

            {/* ── Aba Fluxo de Caixa (Básico+) ── */}
            <TabsTrigger value="fluxo" className="gap-1">
              Fluxo de Caixa
              {fluxoBloqueado && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
            </TabsTrigger>

            {/* ── Aba Receitas vs Despesas (Premium+) ── */}
            <TabsTrigger value="financeiro" className="gap-1">
              Receitas/Despesas
              {receitasBloqueado && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
            </TabsTrigger>
          </TabsList>

          {/* ── Relatórios básicos — todos os planos ── */}
          <TabsContent value="periodo" className="space-y-6">
            <ProcessosPeriodoChart data={processosPeriodo} />
            <ProcessosPeriodoTable data={processosPeriodo} />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <ProcessosStatusChart data={processosStatus} />
            <ProcessosStatusTable data={processosStatus} />
          </TabsContent>

          <TabsContent value="cliente" className="space-y-6">
            <ProcessosClienteChart data={processosCliente} />
            <ProcessosClienteTable data={processosCliente} />
          </TabsContent>

          <TabsContent value="servico" className="space-y-6">
            <ProcessosServicoChart data={processosServico} />
            <ProcessosServicoTable data={processosServico} />
          </TabsContent>

          <TabsContent value="prazos" className="space-y-6">
            <ControlePrazosChart data={controlePrazos} />
            <ControlePrazosTable data={controlePrazos} />
          </TabsContent>

          {/* ── Por Loja — todos os planos ── */}
          <TabsContent value="loja" className="space-y-6">
            <ProcessosLojaTable filtros={filtros} />
          </TabsContent>

          {/* ── Detalhado — todos os planos ── */}
          <TabsContent value="detalhado" className="space-y-6">
            <RelatorioDetalhadoTable filtros={filtros} />
          </TabsContent>

          {/* ── Fluxo de Caixa — Básico ou superior ── */}
          <TabsContent value="fluxo" className="space-y-6">
            {fluxoBloqueado ? (
              <RelatorioBloqueado
                titulo="Fluxo de Caixa"
                planoMinimo="Básico"
              />
            ) : (
              <>
                <FluxoCaixaChart data={fluxoCaixa} />
                <FluxoCaixaTable data={fluxoCaixa} />
              </>
            )}
          </TabsContent>

          {/* ── Receitas vs Despesas — Premium ou superior ── */}
          <TabsContent value="financeiro" className="space-y-6">
            {receitasBloqueado ? (
              <RelatorioBloqueado
                titulo="Receitas vs Despesas"
                planoMinimo="Premium"
              />
            ) : (
              <>
                <ReceitasDespesasChart data={receitasDespesas} />
                <ReceitasDespesasTable data={receitasDespesas} />
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default Relatorios
