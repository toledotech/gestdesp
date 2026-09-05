export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          empresa_id: string
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          uf: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      compromissos: {
        Row: {
          cliente_id: string | null
          created_at: string
          data_hora: string
          descricao: string | null
          empresa_id: string
          id: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data_hora: string
          descricao?: string | null
          empresa_id: string
          id?: string
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data_hora?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compromissos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compromissos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_empresa: {
        Row: {
          celular: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          configuracoes_notificacao: Json | null
          configuracoes_sistema: Json | null
          cor_tema: string | null
          created_at: string
          email: string | null
          empresa_id: string | null
          endereco: string | null
          estado: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          logo_url: string | null
          nome_empresa: string
          razao_social: string | null
          site: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          configuracoes_notificacao?: Json | null
          configuracoes_sistema?: Json | null
          cor_tema?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          nome_empresa: string
          razao_social?: string | null
          site?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          configuracoes_notificacao?: Json | null
          configuracoes_sistema?: Json | null
          cor_tema?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          logo_url?: string | null
          nome_empresa?: string
          razao_social?: string | null
          site?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_empresa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: true
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      creditos_lojas: {
        Row: {
          created_at: string
          data: string
          descricao: string
          empresa_id: string
          id: string
          loja_id: string
          processo_id: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          empresa_id: string
          id?: string
          loja_id: string
          processo_id?: string | null
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          empresa_id?: string
          id?: string
          loja_id?: string
          processo_id?: string | null
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "creditos_lojas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_lojas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_lojas_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          ativo: boolean
          cnpj: string | null
          created_at: string
          id: string
          nome: string
          plano: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
          plano?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
          plano?: string
          updated_at?: string
        }
        Relationships: []
      }
      lojas: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato: string | null
          created_at: string
          email: string | null
          empresa_id: string
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          empresa_id: string
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          empresa_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lojas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      processos: {
        Row: {
          cliente_id: string
          created_at: string
          data_abertura: string | null
          documentos_recebidos: string[] | null
          empresa_id: string
          id: string
          loja_id: string | null
          numero_processo: string | null
          numero_protocolo: string
          observacoes: string | null
          prazo: string | null
          servico: Database["public"]["Enums"]["servico_tipo"]
          status: Database["public"]["Enums"]["processo_status"]
          updated_at: string
          user_id: string
          valor: number
          valor_boleto: number
          valor_dut: number
          veiculo_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_abertura?: string | null
          documentos_recebidos?: string[] | null
          empresa_id: string
          id?: string
          loja_id?: string | null
          numero_processo?: string | null
          numero_protocolo: string
          observacoes?: string | null
          prazo?: string | null
          servico: Database["public"]["Enums"]["servico_tipo"]
          status?: Database["public"]["Enums"]["processo_status"]
          updated_at?: string
          user_id: string
          valor: number
          valor_boleto?: number
          valor_dut?: number
          veiculo_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_abertura?: string | null
          documentos_recebidos?: string[] | null
          empresa_id?: string
          id?: string
          loja_id?: string | null
          numero_processo?: string | null
          numero_protocolo?: string
          observacoes?: string | null
          prazo?: string | null
          servico?: Database["public"]["Enums"]["servico_tipo"]
          status?: Database["public"]["Enums"]["processo_status"]
          updated_at?: string
          user_id?: string
          valor?: number
          valor_boleto?: number
          valor_dut?: number
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          interval_type: string | null
          is_active: boolean | null
          is_public: boolean
          name: string
          price_cents: number
          stripe_price_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval_type?: string | null
          is_active?: boolean | null
          is_public?: boolean
          name: string
          price_cents: number
          stripe_price_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval_type?: string | null
          is_active?: boolean | null
          is_public?: boolean
          name?: string
          price_cents?: number
          stripe_price_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transacoes_financeiras: {
        Row: {
          categoria: string
          cliente_id: string | null
          created_at: string
          data_transacao: string
          descricao: string
          empresa_id: string
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          processo_id: string | null
          status: string
          tipo: Database["public"]["Enums"]["transacao_tipo"]
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          cliente_id?: string | null
          created_at?: string
          data_transacao?: string
          descricao: string
          empresa_id: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          processo_id?: string | null
          status?: string
          tipo: Database["public"]["Enums"]["transacao_tipo"]
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          created_at?: string
          data_transacao?: string
          descricao?: string
          empresa_id?: string
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          processo_id?: string | null
          status?: string
          tipo?: Database["public"]["Enums"]["transacao_tipo"]
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_transacoes_clientes"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_transacoes_processos"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transacoes_financeiras_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          empresa_id: string | null
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          empresa_id?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          empresa_id?: string | null
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      veiculos: {
        Row: {
          ano: number | null
          chassi: string | null
          cliente_id: string | null
          created_at: string
          empresa_id: string
          id: string
          marca: string
          modelo: string
          placa: string
          renavam: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ano?: number | null
          chassi?: string | null
          cliente_id?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          marca: string
          modelo: string
          placa: string
          renavam?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: number | null
          chassi?: string | null
          cliente_id?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          marca?: string
          modelo?: string
          placa?: string
          renavam?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "veiculos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_ban_user: { Args: { target_user_id: string }; Returns: undefined }
      admin_create_user: {
        Args: {
          p_email: string
          p_empresa_id?: string
          p_password: string
          p_role?: string
        }
        Returns: string
      }
      admin_unban_user: { Args: { target_user_id: string }; Returns: undefined }
      admin_update_user: {
        Args: {
          p_display_name: string
          p_email: string
          p_role: string
          target_user_id: string
        }
        Returns: undefined
      }
      admin_update_user_role: {
        Args: { new_role: string; target_user_id: string }
        Returns: undefined
      }
      assign_eternal_plan: { Args: { target_email: string }; Returns: Json }
      count_processos_mes: { Args: { target_user_id: string }; Returns: number }
      get_current_empresa_id: { Args: never; Returns: string }
      get_my_plano: { Args: never; Returns: string }
      get_user_role: {
        Args: { target_user_id?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_permission: {
        Args: { action: string; module: string }
        Returns: boolean
      }
      list_all_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          is_banned: boolean
          role: string
          subscription_tier: string
          user_id: string
        }[]
      }
      list_eternal_subscribers: {
        Args: never
        Returns: {
          email: string
          subscribed: boolean
          subscription_end: string
          updated_at: string
          user_id: string
        }[]
      }
      revoke_eternal_plan: { Args: { target_email: string }; Returns: Json }
      supermaster_create_empresa: {
        Args: {
          p_admin_email?: string
          p_admin_nome?: string
          p_admin_senha?: string
          p_cnpj?: string
          p_nome: string
          p_plano?: string
        }
        Returns: string
      }
      supermaster_list_empresa_users: {
        Args: { p_empresa_id: string }
        Returns: {
          created_at: string
          display_name: string
          email: string
          is_banned: boolean
          role: string
          user_id: string
        }[]
      }
      supermaster_list_empresas: {
        Args: never
        Returns: {
          ativo: boolean
          cnpj: string
          created_at: string
          id: string
          nome: string
          plano: string
          total_users: number
        }[]
      }
      supermaster_update_empresa: {
        Args: {
          p_ativo?: boolean
          p_cnpj?: string
          p_empresa_id: string
          p_nome: string
          p_plano?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      processo_status:
        | "Recebido"
        | "Em Conferência"
        | "No DETRAN"
        | "Aguardando Pagamento"
        | "Concluído"
      servico_tipo:
        | "Transferência de Propriedade"
        | "Licenciamento Anual"
        | "2ª Via CRV"
        | "Comunicação de Venda"
        | "IPVA"
        | "Multas"
        | "Outros"
        | "ATPV (Intenção de Venda)"
      transacao_tipo: "receita" | "despesa"
      user_role: "admin" | "gerente" | "usuario" | "super_admin" | "funcionario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      processo_status: [
        "Recebido",
        "Em Conferência",
        "No DETRAN",
        "Aguardando Pagamento",
        "Concluído",
      ],
      servico_tipo: [
        "Transferência de Propriedade",
        "Licenciamento Anual",
        "2ª Via CRV",
        "Comunicação de Venda",
        "IPVA",
        "Multas",
        "Outros",
        "ATPV (Intenção de Venda)",
      ],
      transacao_tipo: ["receita", "despesa"],
      user_role: ["admin", "gerente", "usuario", "super_admin", "funcionario"],
    },
  },
} as const
