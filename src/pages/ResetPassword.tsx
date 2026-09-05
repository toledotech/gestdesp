import { useState, useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import logo from "@/assets/logo.png"
import { Footer } from "@/components/layout/Footer"

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  const navigate = useNavigate()
  const { updatePassword, loading, user } = useAuth()

  // Verifica tokens no hash da URL (onde o Supabase os envia de verdade)
  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const type = params.get('type')

    // Se não há token de recovery e nenhum usuário autenticado, redireciona para login
    if (!accessToken && !type && !loading && !user) {
      navigate({ to: '/login', replace: true })
    }
  }, [loading, user, navigate])

  // Redireciona para home SOMENTE após atualização bem-sucedida da senha
  useEffect(() => {
    if (passwordUpdated) {
      const timer = setTimeout(() => navigate({ to: '/', replace: true }), 1500)
      return () => clearTimeout(timer)
    }
  }, [passwordUpdated, navigate])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword || password.length < 6) return

    const { error } = await updatePassword(password)
    if (!error) {
      setPasswordUpdated(true)
    }
  }

  if (passwordUpdated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-success/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="text-xl font-semibold">Senha atualizada!</h2>
            <p className="text-muted-foreground">Redirecionando para o sistema...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-success/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 flex items-center justify-center">
            <img src={logo} alt="GestDesp Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Redefinir Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {password !== confirmPassword && confirmPassword && (
                <p className="text-sm text-destructive">As senhas não coincidem</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-primary-hover"
              disabled={loading || password !== confirmPassword || password.length < 6}
            >
              {loading ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </form>

          <Footer />
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPassword
