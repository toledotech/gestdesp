import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Shield, Crown, User, UserPlus, Ban, CheckCircle, RefreshCw, Pencil } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UsuarioSistema {
  user_id: string
  email: string
  display_name: string | null
  role: string
  subscription_tier: string
  is_banned: boolean
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Administrador',
  funcionario: 'Funcionário',
  gerente:     'Gerente',
  usuario:     'Usuário',
}

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  admin:       'bg-red-100 text-red-700 border-red-200',
  funcionario: 'bg-blue-100 text-blue-700 border-blue-200',
  gerente:     'bg-indigo-100 text-indigo-700 border-indigo-200',
  usuario:     'bg-gray-100 text-gray-600 border-gray-200',
}

const PLAN_BADGE: Record<string, string> = {
  ETERNAL:    'bg-amber-100 text-amber-700 border-amber-200',
  Enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
  Premium:    'bg-indigo-100 text-indigo-700 border-indigo-200',
  Básico:     'bg-green-100 text-green-700 border-green-200',
  Freemium:   'bg-gray-100 text-gray-600 border-gray-200',
}

function RoleIcon({ role }: { role: string }) {
  if (role === 'super_admin') return <Crown className="h-4 w-4 text-purple-600" />
  if (role === 'admin')       return <Shield className="h-4 w-4 text-red-600" />
  return <User className="h-4 w-4 text-blue-500" />
}

// ─── Modal Novo Usuário ───────────────────────────────────────────────────────

interface NovoUsuarioModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}

function NovoUsuarioModal({ open, onOpenChange, onCreated }: NovoUsuarioModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ display_name: '', email: '', password: '', role: 'funcionario' })
  const { isSuperAdmin, isAdmin } = usePermissions()

  useEffect(() => {
    if (open) setForm({ display_name: '', email: '', password: '', role: 'funcionario' })
  }, [open])

  const handleCreate = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' })
      return
    }
    if (form.password.length < 6) {
      toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.rpc('admin_create_user' as any, {
        p_email:        form.email.trim().toLowerCase(),
        p_password:     form.password,
        p_role:         form.role,
        p_display_name: form.display_name.trim() || null,
      })
      if (error) throw error

      toast({ title: 'Usuário criado com sucesso!' })
      onOpenChange(false)
      onCreated()
    } catch (err: any) {
      toast({ title: 'Erro ao criar usuário', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Novo Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="display_name">Nome completo</Label>
            <Input
              id="display_name"
              type="text"
              placeholder="Nome do usuário"
              value={form.display_name}
              onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@email.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha temporária *</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              O usuário poderá alterar a senha após o primeiro acesso.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="funcionario">Funcionário</SelectItem>
                {isAdmin() && <SelectItem value="gerente">Gerente</SelectItem>}
                {isAdmin() && <SelectItem value="admin">Administrador</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Modal Editar Usuário ─────────────────────────────────────────────────────

interface EditarUsuarioModalProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  usuario: UsuarioSistema | null
  onSaved: () => void
}

function EditarUsuarioModal({ open, onOpenChange, usuario, onSaved }: EditarUsuarioModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ display_name: '', email: '', role: 'funcionario' })
  const { isSuperAdmin, isAdmin } = usePermissions()

  useEffect(() => {
    if (usuario) {
      setForm({
        display_name: usuario.display_name && usuario.display_name !== usuario.email
          ? usuario.display_name
          : '',
        email: usuario.email,
        role:  usuario.role,
      })
    }
  }, [usuario, open])

  const handleSave = async () => {
    if (!form.email.trim()) {
      toast({ title: 'E-mail é obrigatório', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.rpc('admin_update_user', {
        target_user_id: usuario!.user_id,
        p_display_name: form.display_name.trim() || form.email.trim(),
        p_email:        form.email.trim().toLowerCase(),
        p_role:         form.role,
      })
      if (error) throw error
      toast({ title: 'Usuário atualizado com sucesso!' })
      onOpenChange(false)
      onSaved()
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar usuário', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              placeholder="Nome do usuário"
              value={form.display_name}
              onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mail *</Label>
            <Input
              id="edit-email"
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Papel</Label>
            <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="funcionario">Funcionário</SelectItem>
                {isAdmin() && <SelectItem value="gerente">Gerente</SelectItem>}
                {isAdmin() && <SelectItem value="admin">Administrador</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function UsuariosManager() {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([])
  const [loading, setLoading] = useState(true)
  const [alterando, setAlterando] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModal, setEditModal] = useState<{ open: boolean; usuario: UsuarioSistema | null }>({ open: false, usuario: null })
  const [banDialog, setBanDialog] = useState<{ open: boolean; usuario: UsuarioSistema | null }>({ open: false, usuario: null })
  const { toast } = useToast()

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('list_all_users')
      if (error) throw error
      setUsuarios((data as UsuarioSistema[]) || [])
    } catch (err: any) {
      toast({ title: 'Erro ao carregar usuários', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleBanToggle = async () => {
    const u = banDialog.usuario
    if (!u) return
    setAlterando(u.user_id)
    setBanDialog({ open: false, usuario: null })
    try {
      const fn = u.is_banned ? 'admin_unban_user' : 'admin_ban_user'
      const { error } = await supabase.rpc(fn, { target_user_id: u.user_id })
      if (error) throw error
      setUsuarios(prev => prev.map(x =>
        x.user_id === u.user_id ? { ...x, is_banned: !u.is_banned } : x
      ))
      toast({
        title: u.is_banned ? 'Usuário reativado' : 'Usuário inativado',
        description: u.is_banned
          ? `${u.email} pode acessar o sistema novamente.`
          : `${u.email} não conseguirá mais fazer login.`,
      })
    } catch (err: any) {
      toast({ title: 'Erro ao alterar status', description: err.message, variant: 'destructive' })
    } finally {
      setAlterando(null)
    }
  }

  useEffect(() => { fetchUsuarios() }, [])

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    )
  }

  const ativos   = usuarios.filter(u => !u.is_banned)
  const inativos = usuarios.filter(u => u.is_banned)

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Usuários do Sistema
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ativos.length} ativo{ativos.length !== 1 ? 's' : ''}
            {inativos.length > 0 && `, ${inativos.length} inativo${inativos.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsuarios} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {usuarios.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Nenhum usuário encontrado.
              </div>
            )}

            {usuarios.map(usuario => (
              <div
                key={usuario.user_id}
                className={`flex items-center justify-between gap-4 px-6 py-4 transition-colors ${
                  usuario.is_banned ? 'bg-muted/40 opacity-60' : 'hover:bg-muted/30'
                }`}
              >
                {/* Avatar + info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                    usuario.is_banned ? 'bg-gray-200' : 'bg-primary/10'
                  }`}>
                    {usuario.is_banned
                      ? <Ban className="h-4 w-4 text-gray-400" />
                      : <RoleIcon role={usuario.role} />
                    }
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {usuario.display_name && usuario.display_name !== usuario.email
                          ? usuario.display_name
                          : usuario.email}
                      </p>
                      {usuario.is_banned && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full border bg-red-100 text-red-600 border-red-200 font-medium shrink-0">
                          Inativo
                        </span>
                      )}
                    </div>
                    {usuario.display_name && usuario.display_name !== usuario.email && (
                      <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Desde {format(new Date(usuario.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                {/* Badges + ações */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Role */}
                  <span className={`hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_BADGE[usuario.role] ?? ROLE_BADGE['usuario']}`}>
                    {ROLE_LABELS[usuario.role] ?? usuario.role}
                  </span>

                  {/* Plano */}
                  <span className={`hidden md:inline-flex text-xs px-2 py-0.5 rounded-full border font-medium ${PLAN_BADGE[usuario.subscription_tier] ?? PLAN_BADGE['Freemium']}`}>
                    {usuario.subscription_tier}
                  </span>

                  {/* Editar */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    disabled={alterando === usuario.user_id}
                    onClick={() => setEditModal({ open: true, usuario })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>

                  {/* Inativar / Reativar */}
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-8 gap-1 text-xs ${
                      usuario.is_banned
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200'
                        : 'text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200'
                    }`}
                    disabled={alterando === usuario.user_id}
                    onClick={() => setBanDialog({ open: true, usuario })}
                  >
                    {usuario.is_banned
                      ? <><CheckCircle className="h-3.5 w-3.5" /> Reativar</>
                      : <><Ban className="h-3.5 w-3.5" /> Inativar</>
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legenda papéis */}
      <div className="text-xs text-muted-foreground space-y-1 px-1">
        <p><span className="font-medium text-red-600">Administrador</span> — acesso total ao próprio negócio, pode gerenciar funcionários.</p>
        <p><span className="font-medium text-blue-600">Funcionário</span> — acesso restrito a lançamentos: processos, clientes e agenda.</p>
      </div>

      {/* Modal criar usuário */}
      <NovoUsuarioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreated={fetchUsuarios}
      />

      {/* Modal editar usuário */}
      <EditarUsuarioModal
        open={editModal.open}
        onOpenChange={open => setEditModal(p => ({ ...p, open }))}
        usuario={editModal.usuario}
        onSaved={fetchUsuarios}
      />

      {/* Dialog confirmar inativação/reativação */}
      <AlertDialog open={banDialog.open} onOpenChange={open => setBanDialog(p => ({ ...p, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {banDialog.usuario?.is_banned ? 'Reativar usuário?' : 'Inativar usuário?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {banDialog.usuario?.is_banned
                ? `${banDialog.usuario.email} voltará a ter acesso ao sistema.`
                : `${banDialog.usuario?.email} será impedido de fazer login. Os dados dele serão preservados.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanToggle}
              className={banDialog.usuario?.is_banned
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-destructive hover:bg-destructive/90'
              }
            >
              {banDialog.usuario?.is_banned ? 'Reativar' : 'Inativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
