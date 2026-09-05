import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, AlertCircle } from "lucide-react"
import { useSubscription } from "@/hooks/useSubscription"

export const SubscriptionPlans = () => {
  const { plans, subscriptionStatus, createCheckout, loading, stripeDisponivel } = useSubscription()

  const formatPrice = (priceInCents: number, currency: string) => {
    const price = priceInCents / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency?.toUpperCase() ?? 'BRL',
    }).format(price)
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum plano disponível no momento.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!stripeDisponivel && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium text-sm">Integração de pagamento não configurada</p>
            <p className="text-xs mt-0.5 text-amber-700">
              Os planos estão exibidos para visualização. Para ativar cobranças, configure a integração com o Stripe.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = subscriptionStatus.subscription_tier === plan.name
          const features = Array.isArray(plan.features) ? plan.features : []

          return (
            <Card key={plan.id} className={`relative ${isCurrentPlan ? 'border-primary' : ''}`}>
              {isCurrentPlan && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Plano Atual
                </Badge>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {formatPrice(plan.price_cents, plan.currency ?? 'BRL')}
                  </span>
                  <span className="text-muted-foreground">
                    /{plan.interval_type === 'month' ? 'mês' : 'ano'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={() => createCheckout(plan.id)}
                  disabled={loading || isCurrentPlan || !stripeDisponivel}
                  variant={isCurrentPlan ? "outline" : "default"}
                >
                  {isCurrentPlan
                    ? 'Plano Atual'
                    : !stripeDisponivel
                    ? 'Pagamento não configurado'
                    : 'Assinar Agora'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
