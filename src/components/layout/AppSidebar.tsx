import {
  Home,
  Users,
  Car,
  FileText,
  Calendar,
  AlertTriangle,
  DollarSign,
  Settings,
  BarChart3,
  Bell,
  CreditCard,
  Package,
  Store,
  BookOpen,
  Building2
} from "lucide-react"
import { Link, useLocation } from "@tanstack/react-router"
import { usePermissions } from "@/hooks/usePermissions"

type MenuAccess = 'all' | 'admin' | 'super_admin'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const superMasterItems = [
  { title: "Painel Admin", url: "/admin", icon: Building2 },
]

const allMenuItems: { title: string; url: string; icon: any; access: MenuAccess }[] = [
  { title: "Dashboard",        url: "/",             icon: Home,          access: 'all'        },
  { title: "Processos",        url: "/processos",    icon: FileText,      access: 'all'        },
  { title: "Agenda",           url: "/agenda",       icon: Calendar,      access: 'all'        },
  { title: "Clientes",         url: "/clientes",     icon: Users,         access: 'all'        },
  { title: "Veículos",         url: "/veiculos",     icon: Car,           access: 'all'        },
  { title: "Lojas",            url: "/lojas",        icon: Store,         access: 'admin'      },
  { title: "Financeiro",       url: "/financeiro",   icon: DollarSign,    access: 'admin'      },
  { title: "Prazos",           url: "/prazos",       icon: AlertTriangle, access: 'all'        },
  { title: "Relatórios",       url: "/relatorios",   icon: BarChart3,     access: 'admin'      },
  { title: "Notificações",     url: "/notifications",icon: Bell,          access: 'all'        },
  { title: "Assinatura",       url: "/assinatura",   icon: CreditCard,    access: 'super_admin'},
  { title: "Gerenciar Planos", url: "/planos",       icon: Package,       access: 'super_admin'},
  { title: "Configurações",    url: "/configuracoes",icon: Settings,      access: 'admin'      },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { isAdmin, isSuperAdmin, isSuperMaster } = usePermissions()
  const location = useLocation()

  // SuperMaster (sem empresa) vê apenas o Painel Admin
  const isSM = isSuperMaster()
  const menuItems = isSM
    ? superMasterItems
    : allMenuItems.filter(item => {
        if (item.access === 'super_admin') return isSuperAdmin()
        if (item.access === 'admin') return isAdmin()
        return true
      })

  return (
    <Sidebar collapsible="icon" className="border-r border-blue-800">
      <SidebarContent className="bg-gradient-to-b from-blue-900 to-blue-800">
        <SidebarGroup className="px-3 pt-6 pb-4">
          <SidebarGroupLabel className={`${isCollapsed ? 'hidden' : 'block'} text-blue-300 font-semibold uppercase tracking-widest text-xs mb-2`}>
            Menu Principal
          </SidebarGroupLabel>

          <SidebarGroupContent className="mt-2">
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive = item.url === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative w-full ${
                        isActive
                          ? 'bg-white/15 text-cyan-300 shadow-md'
                          : 'text-blue-200 hover:bg-white/20 hover:text-cyan-300'
                      }`}
                    >
                      <div className="p-1.5 shrink-0">
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      {!isCollapsed && (
                        <span className="font-medium text-sm">{item.title}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="absolute right-3 w-1 h-5 bg-white/70 rounded-full"></div>
                      )}
                    </Link>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Botão do Manual */}
        <div className={`px-3 pb-6 mt-auto ${isCollapsed ? 'flex justify-center' : ''}`}>
          <a
            href="/manual.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-blue-300 hover:bg-white/20 hover:text-cyan-300 w-full"
          >
            <div className="p-1.5 shrink-0">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-medium text-sm">Manual do Sistema</span>
            )}
          </a>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
