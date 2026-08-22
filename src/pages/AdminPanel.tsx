import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import { useEmpresas, Empresa, EmpresaUser, CriarEmpresaParams } from '@/hooks/useEmpresas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Building2, Users, Plus, Edit2, Power, PowerOff, UserPlus, Search
} from 'lucide-react'

const PLANOS = ['Freemium', 'Básico', 'Premium', 'Enterprise', 'ETERNAL']

const planoBadgeColor: Record<string, string> = {
  'Freemium':   'bg-gray-100 text-gray-700',
  'Básico':     'bg-blue-100 text-blue-700',
  'Premium':    'bg-purple-100 text-purple-700',
  'Enterprise': 'bg-orange-100 text-orange-700',
  'ETERNAL':    'bg-gradient-to-r from-yellow-400 to-orange-400 text-white',
}

// ─── Modal: Nova / Editar Empresa ─────────────────────────────────────────────
interface EmpresaModalProps {
  open: boolean
  onClose: () => void
  empresa?: Empresa | null
  onSave: (params: CriarEmpresaParams, empresaId?: string) => Promise<void>
}

function EmpresaModal({ open, onClose, empresa, onSave }: EmpresaModalProps) {
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [plano, setPlano] = useState('Freemium')
  const [adminNome, setAdminNome] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminSenha, setAdminSenha] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setNome(empresa?.nome ?? '')
      setCnpj(empresa?.cnpj ?? '')
      setPlano(empresa?.plano ?? 'Freemium')
      setAdminNome('')
      setAdminEmail('')
      setAdminSenha('')
    }
  }, [open, empresa])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        nome, cnpj, plano,
        admin_nome: adminNome || undefined,
        admin_email: adminEmail || undefined,
        admin_senha: adminSenha || undefined,
      }, empresa?.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const isEdicao = !!empresa

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdicao ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="nome">Nome da empresa *</Label>
            <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
          </div>

          <div className="space-y-1">
            <Label>Plano</Label>
            <Select value={plano} onValueChange={setPlano}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {!isEdicao && (
            <>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-foreground mb-3">Usuário Administrador (opcional)</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="adminNome">Nome</Label>
                    <Input id="adminNome" value={adminNome} onChange={e => setAdminNome(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adminEmail">E-mail</Label>
                    <Input id="adminEmail" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adminSenha">Senha temporária</Label>
                    <Input id="adminSenha" type="password" value={adminSenha} onChange={e => setAdminSenha(e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !nome.trim()}>
              {saving ? 'Salvando...' : isEdicao ? 'Salvar' : 'Criar Empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Modal: Usuários da Empresa ───────────────────────────────────────────────
interface UsuariosModalProps {
  open: boolean
  onClose: () => void
  empresa: Empresa | null
  fetchUsers: (id: string) => Promise<EmpresaUser[]>
  addUser: (empresaId: string, params: { email: string; senha: string; nome?: string; role?: string }) => Promise<void>
}

function UsuariosModal({ open, onClose, empresa, fetchUsers, addUser }: UsuariosModalProps) {
  const [users, setUsers] = useState<EmpresaUser[]>([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [role, setRole] = useState('admin')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && empresa) {
      setLoading(true)
      fetchUsers(empresa.id)
        .then(setUsers)
        .catch(() => toast({ title: 'Erro', description: 'Erro ao carregar usuários', variant: 'destructive' }))
        .finally(() => setLoading(false))
    }
    if (!open) { setShowAdd(false); setEmail(''); setSenha(''); setNome(''); setRole('admin') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, empresa])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empresa) return
    setSaving(true)
    try {
      await addUser(empresa.id, { email, senha, nome, role })
      toast({ title: 'Usuário criado!', description: `${email} foi adicionado à ${empresa.nome}` })
      const updated = await fetchUsers(empresa.id)
      setUsers(updated)
      setShowAdd(false)
      setEmail(''); setSenha(''); setNome(''); setRole('admin')
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message ?? 'Erro ao criar usuário', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const roleLabel: Record<string, string> = {
    super_admin: 'SuperAdmin', admin: 'Admin', gerente: 'Gerente',
    funcionario: 'Funcionário', usuario: 'Usuário'
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários — {empresa?.nome}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-gray-500 py-4 text-center">Carregando...</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {users.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nenhum usuário cadastrado.</p>}
            {users.map(u => (
              <div key={u.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <div>
                  <p className="font-medium text-sm">{u.display_name || u.email}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{roleLabel[u.role] ?? u.role}</Badge>
                  {u.is_banned && <Badge variant="destructive">Banido</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}

        {showAdd ? (
          <form onSubmit={handleAdd} className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Adicionar usuário</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Perfil</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>E-mail *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Senha temporária *</Label>
              <Input type="password" value={senha} onChange={e => setSenha(e.target.value)} required />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)} disabled={saving}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-center border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Adicionar Usuário
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { isSuperAdmin, isSuperMaster, userProfile, loading: permLoading } = usePermissions()
  const { empresas, loading, fetchEmpresas, fetchEmpresaUsers, criarEmpresa, atualizarEmpresa, adicionarUsuario } = useEmpresas()
  const [busca, setBusca] = useState('')
  const [empresaModal, setEmpresaModal] = useState<{ open: boolean; empresa?: Empresa | null }>({ open: false })
  const [usuariosModal, setUsuariosModal] = useState<{ open: boolean; empresa: Empresa | null }>({ open: false, empresa: null })
  const { toast } = useToast()

  useEffect(() => {
    if (!permLoading && isSuperAdmin()) {
      fetchEmpresas()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permLoading])

  if (permLoading) return null
  if (!isSuperAdmin() || !isSuperMaster()) return <Navigate to="/" replace />

  const empresasFiltradas = empresas.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (e.cnpj ?? '').includes(busca)
  )

  const handleSave = async (params: CriarEmpresaParams, empresaId?: string) => {
    try {
      if (empresaId) {
        await atualizarEmpresa(empresaId, { nome: params.nome, cnpj: params.cnpj, plano: params.plano })
        toast({ title: 'Empresa atualizada!' })
      } else {
        await criarEmpresa(params)
        toast({ title: 'Empresa criada!', description: `${params.nome} foi cadastrada com sucesso.` })
      }
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message ?? 'Operação falhou', variant: 'destructive' })
      throw err
    }
  }

  const handleToggleAtivo = async (empresa: Empresa) => {
    try {
      await atualizarEmpresa(empresa.id, { nome: empresa.nome, ativo: !empresa.ativo })
      toast({ title: empresa.ativo ? 'Empresa desativada' : 'Empresa ativada' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-cyan-300" />
            <div>
              <h1 className="text-2xl font-bold">Painel SuperMaster</h1>
              <p className="text-blue-200 text-sm">Gestão de empresas e usuários</p>
            </div>
          </div>
          <Button
            onClick={() => setEmpresaModal({ open: true, empresa: null })}
            className="bg-cyan-500 hover:bg-cyan-400 text-white"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Empresa
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">

        {/* Busca + stats */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-gray-500">
            {empresasFiltradas.length} empresa{empresasFiltradas.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Lista de empresas */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando empresas...</div>
        ) : empresasFiltradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma empresa cadastrada</p>
            <p className="text-sm mt-1">Clique em "Nova Empresa" para começar.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {empresasFiltradas.map(empresa => (
              <div
                key={empresa.id}
                className={`bg-white rounded-xl border p-5 shadow-sm flex items-center justify-between gap-4 ${!empresa.ativo ? 'opacity-60' : ''}`}
              >
                {/* Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{empresa.nome}</h3>
                      {!empresa.ativo && <Badge variant="outline" className="text-gray-400 border-gray-300">Inativa</Badge>}
                    </div>
                    {empresa.cnpj && <p className="text-xs text-gray-400 mt-0.5">CNPJ: {empresa.cnpj}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planoBadgeColor[empresa.plano] ?? 'bg-gray-100 text-gray-700'}`}>
                        {empresa.plano}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {empresa.total_users} usuário{empresa.total_users !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUsuariosModal({ open: true, empresa })}
                  >
                    <Users className="h-4 w-4 mr-1.5" /> Usuários
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEmpresaModal({ open: true, empresa })}
                  >
                    <Edit2 className="h-4 w-4 mr-1.5" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={empresa.ativo ? 'text-red-500 hover:text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}
                    onClick={() => handleToggleAtivo(empresa)}
                  >
                    {empresa.ativo
                      ? <><PowerOff className="h-4 w-4 mr-1.5" /> Desativar</>
                      : <><Power className="h-4 w-4 mr-1.5" /> Ativar</>
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modais */}
      <EmpresaModal
        open={empresaModal.open}
        onClose={() => setEmpresaModal({ open: false })}
        empresa={empresaModal.empresa}
        onSave={handleSave}
      />
      <UsuariosModal
        open={usuariosModal.open}
        onClose={() => setUsuariosModal({ open: false, empresa: null })}
        empresa={usuariosModal.empresa}
        fetchUsers={fetchEmpresaUsers}
        addUser={adicionarUsuario}
      />
    </div>
  )
}
