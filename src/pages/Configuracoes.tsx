import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { UploadLogo } from '@/components/configuracoes/UploadLogo'
import { BackupExport } from '@/components/configuracoes/BackupExport'
import { PermissionsManager } from '@/components/permissions/PermissionsManager'
import { UsuariosManager } from '@/components/configuracoes/UsuariosManager'
import { useConfiguracoes, ConfiguracoesEmpresa } from '@/hooks/useConfiguracoes'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'
import {
  Building2,
  Users,
  Mail,
  Phone, 
  Globe, 
  MapPin, 
  Palette, 
  Bell, 
  Settings as SettingsIcon,
  Save,
  Loader2,
  Database,
  Shield
} from 'lucide-react'

const empresaSchema = z.object({
  nome_empresa: z.string().min(1, 'Nome da empresa é obrigatório'),
  cnpj: z.string().optional(),
  razao_social: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  site: z.string().optional(),
  cor_tema: z.string().default('#2563eb'),
})

const Configuracoes = () => {
  const { configuracoes, loading, salvarConfiguracoes, uploadLogo } = useConfiguracoes()
  const { isAdmin, loading: loadingPerms } = usePermissions()
  const { loading: authLoading } = useAuth()
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  
  const form = useForm<z.infer<typeof empresaSchema>>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nome_empresa: '',
      cnpj: '',
      razao_social: '',
      inscricao_estadual: '',
      inscricao_municipal: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      telefone: '',
      celular: '',
      email: '',
      site: '',
      cor_tema: '#2563eb',
    }
  })

  // Estado para configurações de notificação e sistema
  const [notificacoes, setNotificacoes] = useState({
    email_processos: true,
    email_prazos: true,
    sms_urgentes: false,
  })

  const [sistemaConfig, setSistemaConfig] = useState({
    auto_backup: true,
    relatorio_mensal: true,
    dashboard_inicial: 'processos',
  })

  useEffect(() => {
    if (configuracoes) {
      form.reset({
        nome_empresa: configuracoes.nome_empresa,
        cnpj: configuracoes.cnpj || '',
        razao_social: configuracoes.razao_social || '',
        inscricao_estadual: configuracoes.inscricao_estadual || '',
        inscricao_municipal: configuracoes.inscricao_municipal || '',
        endereco: configuracoes.endereco || '',
        cidade: configuracoes.cidade || '',
        estado: configuracoes.estado || '',
        cep: configuracoes.cep || '',
        telefone: configuracoes.telefone || '',
        celular: configuracoes.celular || '',
        email: configuracoes.email || '',
        site: configuracoes.site || '',
        cor_tema: configuracoes.cor_tema ?? '#2563eb',
      })
      setNotificacoes(configuracoes.configuracoes_notificacao)
      setSistemaConfig(configuracoes.configuracoes_sistema)
    }
  }, [configuracoes, form])

  const onSubmit = async (data: z.infer<typeof empresaSchema>) => {
    try {
      setSaving(true)
      
      let logoUrl = configuracoes?.logo_url

      // Upload logo se foi selecionado
      if (logoFile) {
        const uploadedLogoUrl = await uploadLogo(logoFile)
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl
        }
      }

      const dadosCompletos: Partial<ConfiguracoesEmpresa> = {
        ...data,
        logo_url: logoUrl,
        configuracoes_notificacao: notificacoes,
        configuracoes_sistema: sistemaConfig,
      }

      await salvarConfiguracoes(dadosCompletos)
      setLogoFile(null) // Limpa o arquivo após salvar com sucesso
    } catch (error) {
      // O erro já é tratado pelo hook useConfiguracoes com toast
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoChange = (file: File) => {
    setLogoFile(file)
  }

  const handleLogoRemove = () => {
    setLogoFile(null)
  }

  if (authLoading || loading || loadingPerms) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-primary rounded-lg">
          <SettingsIcon className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações da sua empresa</p>
        </div>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className={`grid w-full lg:w-auto ${isAdmin() ? 'grid-cols-7' : 'grid-cols-6'}`}>
          <TabsTrigger value="empresa" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          {isAdmin() && (
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
          )}
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="empresa" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Dados da Empresa
                      </CardTitle>
                      <CardDescription>
                        Informações básicas da sua empresa
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="nome_empresa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Empresa *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da sua empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="cnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CNPJ</FormLabel>
                              <FormControl>
                                <Input placeholder="00.000.000/0000-00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="razao_social"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Razão Social</FormLabel>
                              <FormControl>
                                <Input placeholder="Razão social" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="inscricao_estadual"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Inscrição Estadual</FormLabel>
                              <FormControl>
                                <Input placeholder="000.000.000.000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="inscricao_municipal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Inscrição Municipal</FormLabel>
                              <FormControl>
                                <Input placeholder="000000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Endereço
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="endereco"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, número, bairro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="cidade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cidade</FormLabel>
                              <FormControl>
                                <Input placeholder="Cidade" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="estado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado</FormLabel>
                              <FormControl>
                                <Input placeholder="UF" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="cep"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input placeholder="00000-000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>Logo da Empresa</CardTitle>
                      <CardDescription>
                        Adicione o logo da sua empresa
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <UploadLogo
                        logoUrl={configuracoes?.logo_url ?? undefined}
                        onLogoChange={handleLogoChange}
                        onLogoRemove={handleLogoRemove}
                      />
                    </CardContent>
                  </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        Contato
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="telefone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <Input placeholder="(00) 0000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="celular"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Celular</FormLabel>
                              <FormControl>
                                <Input placeholder="(00) 00000-0000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input placeholder="contato@empresa.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="site"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Site</FormLabel>
                            <FormControl>
                              <Input placeholder="https://www.empresa.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="aparencia" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    Personalização Visual
                  </CardTitle>
                  <CardDescription>
                    Customize a aparência do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="cor_tema"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor do Tema</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-4">
                            <Input
                              type="color"
                              className="w-16 h-10 p-1 border rounded cursor-pointer"
                              {...field}
                            />
                            <Input
                              type="text"
                              placeholder="#2563eb"
                              className="flex-1"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Escolha a cor principal do sistema
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <Label>Prévia das Cores</Label>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div 
                          className="w-full h-12 rounded border mb-2"
                          style={{ backgroundColor: form.watch('cor_tema') }}
                        />
                        <span className="text-sm text-muted-foreground">Principal</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-full h-12 rounded border mb-2"
                          style={{ backgroundColor: `${form.watch('cor_tema')}20` }}
                        />
                        <span className="text-sm text-muted-foreground">Claro</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-full h-12 rounded border mb-2 bg-background"
                        />
                        <span className="text-sm text-muted-foreground">Fundo</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-full h-12 rounded border mb-2 bg-card"
                        />
                        <span className="text-sm text-muted-foreground">Card</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notificacoes" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Preferências de Notificação
                  </CardTitle>
                  <CardDescription>
                    Configure quando e como receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notificações de Processos</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba e-mails sobre novos processos e atualizações
                        </p>
                      </div>
                      <Switch
                        checked={notificacoes.email_processos}
                        onCheckedChange={(checked) =>
                          setNotificacoes(prev => ({ ...prev, email_processos: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alertas de Prazo</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba e-mails quando processos estiverem próximos do prazo
                        </p>
                      </div>
                      <Switch
                        checked={notificacoes.email_prazos}
                        onCheckedChange={(checked) =>
                          setNotificacoes(prev => ({ ...prev, email_prazos: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>SMS Urgentes</Label>
                        <p className="text-sm text-muted-foreground">
                          Receba SMS para situações urgentes (funcionalidade futura)
                        </p>
                      </div>
                      <Switch
                        checked={notificacoes.sms_urgentes}
                        onCheckedChange={(checked) =>
                          setNotificacoes(prev => ({ ...prev, sms_urgentes: checked }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sistema" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                    Configurações do Sistema
                  </CardTitle>
                  <CardDescription>
                    Configure o comportamento do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Backup Automático</Label>
                        <p className="text-sm text-muted-foreground">
                          Criar backups automáticos dos dados
                        </p>
                      </div>
                      <Switch
                        checked={sistemaConfig.auto_backup}
                        onCheckedChange={(checked) =>
                          setSistemaConfig(prev => ({ ...prev, auto_backup: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Relatório Mensal</Label>
                        <p className="text-sm text-muted-foreground">
                          Gerar relatórios mensais automaticamente
                        </p>
                      </div>
                      <Switch
                        checked={sistemaConfig.relatorio_mensal}
                        onCheckedChange={(checked) =>
                          setSistemaConfig(prev => ({ ...prev, relatorio_mensal: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Página Inicial do Dashboard</Label>
                      <Select
                        value={sistemaConfig.dashboard_inicial}
                        onValueChange={(value) =>
                          setSistemaConfig(prev => ({ ...prev, dashboard_inicial: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="processos">Processos</SelectItem>
                          <SelectItem value="clientes">Clientes</SelectItem>
                          <SelectItem value="veiculos">Veículos</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Escolha qual página será exibida ao fazer login
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backup" className="space-y-6">
              <BackupExport />
            </TabsContent>

            <TabsContent value="permissoes" className="space-y-6">
              <PermissionsManager />
            </TabsContent>

            {isAdmin() && (
              <TabsContent value="usuarios" className="space-y-6">
                <UsuariosManager />
              </TabsContent>
            )}

            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-primary hover:opacity-90 min-w-32"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  )
}

export default Configuracoes