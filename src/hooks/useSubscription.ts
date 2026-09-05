import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { useToast } from '@/hooks/use-toast'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price_cents: number
  currency: string | null
  interval_type: string | null
  features: any
  is_active: boolean | null
}

export interface SubscriptionStatus {
  subscribed: boolean
  subscription_tier?: string
  subscription_end?: string
}

export const useSubscription = () => {
  const { user, session } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({ subscribed: false })
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  // Indica se a integração com Stripe está disponível (Edge Functions deployadas + chave configurada)
  const [stripeDisponivel, setStripeDisponivel] = useState(false)

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)          // Plano ETERNAL (is_public=false) nunca aparece aqui
        .order('price_cents', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
      toast({ title: 'Erro', description: 'Erro ao carregar planos', variant: 'destructive' })
    }
  }

  /**
   * Lê o status diretamente da tabela `subscribers` (fallback local sem Stripe).
   * Útil para planos manuais como ETERNAL ou quando a Edge Function não está disponível.
   */
  const checkLocalSubscription = async () => {
    if (!user?.email) return
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier, subscription_end')
        .eq('email', user.email)
        .maybeSingle()

      if (!error && data) {
        setSubscriptionStatus({
          subscribed: data.subscribed,
          subscription_tier: data.subscription_tier ?? undefined,
          subscription_end: data.subscription_end ?? undefined,
        })
      }
    } catch {
      // ignora — sem impacto na UX
    }
  }

  const checkSubscription = async () => {
    if (!session) return

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      // Qualquer erro da função = Stripe não configurado/deployado
      if (error) {
        setStripeDisponivel(false)
        // Fallback: tenta ler o status local (ex.: plano ETERNAL atribuído manualmente)
        await checkLocalSubscription()
        return
      }

      // Sucesso — Stripe está ativo
      setStripeDisponivel(true)
      setSubscriptionStatus(data)
    } catch {
      // Falha de rede ou função inexistente — tenta fallback local
      setStripeDisponivel(false)
      await checkLocalSubscription()
    } finally {
      setLoading(false)
    }
  }

  const createCheckout = async (planId: string) => {
    if (!session) {
      toast({ title: 'Atenção', description: 'Você precisa estar logado', variant: 'destructive' })
      return
    }

    if (!stripeDisponivel) {
      toast({ title: 'Pagamento não configurado', description: 'A integração com Stripe ainda não está ativa neste ambiente.', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) throw error

      // Abre o checkout do Stripe em nova aba
      window.open(data.url, '_blank')
    } catch (error) {
      console.error('Error creating checkout:', error)
      toast({ title: 'Erro', description: 'Erro ao criar checkout', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openCustomerPortal = async () => {
    if (!session) {
      toast({ title: 'Atenção', description: 'Você precisa estar logado', variant: 'destructive' })
      return
    }

    if (!stripeDisponivel) {
      toast({ title: 'Pagamento não configurado', description: 'A integração com Stripe ainda não está ativa neste ambiente.', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) throw error

      // Abre o portal do cliente em nova aba
      window.open(data.url, '_blank')
    } catch (error) {
      console.error('Error opening customer portal:', error)
      toast({ title: 'Erro', description: 'Erro ao abrir portal do cliente', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    if (user) {
      checkSubscription()
    }
  }, [user, session])

  return {
    subscriptionStatus,
    plans,
    loading,
    stripeDisponivel,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    fetchPlans
  }
}