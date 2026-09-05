import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Edit, Plus, Crown, UserCheck, UserX, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Plan {
  id: string
  name: string
  description: string | null
  price_cents: number
  currency: string | null
  interval_type: string | null
  features: any
  is_active: boolean | null
  is_public: boolean
}

interface EternalSubscriber {
  email: string
  user_id: string | null
  subscribed: boolean
  subscription_end: string | null
  updated_at: string
}

const PlansManagement = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_cents: 0,
    currency: 'brl',
    interval_type: 'month',
    features: [''],
    is_active: true,
    is_public: true,
  })

  // Estado da seção ETERNAL
  const [eternalEmail, setEternalEmail] = useState('')
  const [eternalLoading, setEternalLoading] = useState(false)
  const [eternalSubscribers, setEternalSubscribers] = useState<EternalSubscriber[]>([])

  // ─── Planos ────────────────────────────────────────────────────────────────

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_cents', { ascending: true })

      if (error) throw error
      setPlans(data?.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
        is_public: plan.is_public ?? true,
      })) || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast({ title: 'Erro', description: 'Erro ao carregar planos', variant: 'destructive' })
    }
  }

  const savePlan = async () => {
    if (!user) return

    setLoading(true)
    try {
      const planData = {
        ...formData,
        user_id: user.id,
        features: formData.features.filter(f => f.trim() !== ''),
      }

      let result
      if (editingPlan) {
        result = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id)
      } else {
        result = await supabase
          .from('subscription_plans')
          .insert([planData])
      }

      if (result.error) throw result.error

      toast({ title: 'Sucesso', description: editingPlan ? 'Plano atualizado!' : 'Plano criado!' })
      setIsDialogOpen(false)
      resetForm()
      fetchPlans()
    } catch (error) {
      console.error('Error saving plan:', error)
      toast({ title: 'Erro', description: 'Erro ao salvar plano', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId)

      if (error) throw error
      toast({ title: 'Sucesso', description: 'Plano excluído!' })
      fetchPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast({ title: 'Erro', description: 'Erro ao excluir plano', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price_cents: 0,
      currency: 'brl',
      interval_type: 'month',
      features: [''],
      is_active: true,
      is_public: true,
    })
    setEditingPlan(null)
  }

  const editPlan = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price_cents: plan.price_cents,
      currency: plan.currency ?? 'BRL',
      interval_type: plan.interval_type ?? 'month',
      features: plan.features.length > 0 ? plan.features : [''],
      is_active: plan.is_active ?? true,
      is_public: plan.is_public,
    })
    setIsDialogOpen(true)
  }

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => (i === index ? value : f)),
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  const formatPrice = (priceInCents: number, currency: string) => {
    if (priceInCents === 0) return 'Gratuito'
    const price = priceInCents / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price)
  }

  // ─── Plano ETERNAL ─────────────────────────────────────────────────────────

  const fetchEternalSubscribers = async () => {
    try {
      const { data, error } = await supabase.rpc('list_eternal_subscribers')
      if (error) throw error
      setEternalSubscribers(data || [])
    } catch (error) {
      console.error('Error fetching eternal subscribers:', error)
    }
  }

  const assignEternal = async () => {
    const email = eternalEmail.trim().toLowerCase()
    if (!email) {
      toast({ title: 'Atenção', description: 'Informe o e-mail do usuário.', variant: 'destructive' })
      return
    }

    setEternalLoading(true)
    try {
      const { data, error } = await supabase.rpc('assign_eternal_plan', { target_email: email })
      if (error) throw error

      toast({
        title: 'Plano ETERNAL atribuído!',
        description: `O usuário ${email} agora possui o plano ETERNAL.`,
      })
      setEternalEmail('')
      fetchEternalSubscribers()
    } catch (error: any) {
      console.error('Error assigning eternal plan:', error)
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao atribuir plano ETERNAL.',
        variant: 'destructive',
      })
    } finally {
      setEternalLoading(false)
    }
  }

  const revokeEternal = async (email: string) => {
    setEternalLoading(true)
    try {
      const { data, error } = await supabase.rpc('revoke_eternal_plan', { target_email: email })
      if (error) throw error

      toast({ title: 'Plano revogado', description: `Plano ETERNAL removido de ${email}.` })
      fetchEternalSubscribers()
    } catch (error: any) {
      console.error('Error revoking eternal plan:', error)
      toast({
        title: 'Erro',
        description: error?.message || 'Erro ao revogar plano ETERNAL.',
        variant: 'destructive',
      })
    } finally {
      setEternalLoading(false)
    }
  }

  const formatDate = (dateString: string) =>
    format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  // ─── Efeitos ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPlans()
    fetchEternalSubscribers()
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────

  const publicPlans = plans.filter(p => p.is_public)
  const eternalPlan = plans.find(p => p.name === 'ETERNAL')

  return (
    <div className="container mx-auto p-6 space-y-8">

      {/* ── Cabeçalho + botão novo plano ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Planos</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de assinatura e a atribuição do plano ETERNAL.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? 'Edite as informações do plano.'
                  : 'Crie um novo plano de assinatura.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Plano</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Básico"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (em centavos)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price_cents}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, price_cents: Number(e.target.value) }))
                    }
                    placeholder="4900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição do plano..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={value => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brl">BRL (Real)</SelectItem>
                      <SelectItem value="usd">USD (Dólar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Intervalo</Label>
                  <Select
                    value={formData.interval_type}
                    onValueChange={value => setFormData(prev => ({ ...prev, interval_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mensal</SelectItem>
                      <SelectItem value="year">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Recursos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={e => updateFeature(index, e.target.value)}
                        placeholder="Ex: Até 50 processos/mês"
                      />
                      {formData.features.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="is_active">Plano ativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={e => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                  />
                  <Label htmlFor="is_public">Visível para clientes</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={savePlan} disabled={loading}>
                  {loading ? 'Salvando...' : editingPlan ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Planos públicos ── */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Planos Públicos</h2>
        <div className="grid gap-4">
          {publicPlans.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhum plano público cadastrado.</p>
          )}
          {publicPlans.map(plan => (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {!plan.is_active && <Badge variant="secondary">Inativo</Badge>}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">
                      {formatPrice(plan.price_cents, plan.currency ?? 'BRL')}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.interval_type === 'month' ? 'mês' : 'ano'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {plan.features.map((feature: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => editPlan(plan)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deletePlan(plan.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* ── Plano ETERNAL ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-amber-500" />
          <div>
            <h2 className="text-xl font-semibold">Plano ETERNAL</h2>
            <p className="text-sm text-muted-foreground">
              Plano exclusivo e invisível. Atribuído manualmente pelo administrador.
            </p>
          </div>
        </div>

        {/* Card de info do plano ETERNAL */}
        {eternalPlan && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <Crown className="h-4 w-4" />
                  {eternalPlan.name}
                  <Badge className="bg-amber-500 text-white border-0 ml-1">Exclusivo</Badge>
                  {!eternalPlan.is_active && <Badge variant="secondary">Inativo</Badge>}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => editPlan(eternalPlan)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
              </div>
              <CardDescription>{eternalPlan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {eternalPlan.features.map((feature: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs border-amber-300 text-amber-700">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Atribuir ETERNAL a um usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Atribuir Plano ETERNAL
            </CardTitle>
            <CardDescription>
              Informe o e-mail do usuário que receberá o plano ETERNAL. O usuário será
              atualizado imediatamente — sem necessidade de interação do Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={eternalEmail}
                  onChange={e => setEternalEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && assignEternal()}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={assignEternal}
                disabled={eternalLoading || !eternalEmail.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {eternalLoading ? 'Atribuindo...' : 'Atribuir'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuários ETERNAL */}
        {eternalSubscribers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usuários com Plano ETERNAL</CardTitle>
              <CardDescription>
                {eternalSubscribers.length} usuário{eternalSubscribers.length !== 1 ? 's' : ''} com
                acesso ao plano ETERNAL.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eternalSubscribers.map(sub => (
                  <div
                    key={sub.email}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{sub.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Atribuído em {formatDate(sub.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={sub.subscribed ? 'default' : 'secondary'}
                        className={sub.subscribed ? 'bg-green-500 border-0' : ''}
                      >
                        {sub.subscribed ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeEternal(sub.email)}
                        disabled={eternalLoading}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        Revogar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default PlansManagement
