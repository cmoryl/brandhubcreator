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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          brand_id: string
          created_at: string
          details: Json | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action_type?: string
          brand_id: string
          created_at?: string
          details?: Json | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          brand_id?: string
          created_at?: string
          details?: Json | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_path: string
          backup_type: string
          brands_count: number
          created_at: string
          created_by: string | null
          error_message: string | null
          file_size_bytes: number | null
          id: string
          organization_id: string
          products_count: number
          status: string
        }
        Insert: {
          backup_path: string
          backup_type?: string
          brands_count?: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          organization_id: string
          products_count?: number
          status?: string
        }
        Update: {
          backup_path?: string
          backup_type?: string
          brands_count?: number
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          organization_id?: string
          products_count?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_intelligence: {
        Row: {
          analysis_count: number
          analysis_history: Json
          brand_summary: string | null
          brand_voice_profile: Json | null
          competitive_advantages: Json | null
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          growth_recommendations: Json | null
          id: string
          knowledge_entries: Json
          last_analyzed_at: string | null
          market_position: string | null
          organization_id: string | null
          target_audience: Json | null
          updated_at: string
        }
        Insert: {
          analysis_count?: number
          analysis_history?: Json
          brand_summary?: string | null
          brand_voice_profile?: Json | null
          competitive_advantages?: Json | null
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          growth_recommendations?: Json | null
          id?: string
          knowledge_entries?: Json
          last_analyzed_at?: string | null
          market_position?: string | null
          organization_id?: string | null
          target_audience?: Json | null
          updated_at?: string
        }
        Update: {
          analysis_count?: number
          analysis_history?: Json
          brand_summary?: string | null
          brand_voice_profile?: Json | null
          competitive_advantages?: Json | null
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          growth_recommendations?: Json | null
          id?: string
          knowledge_entries?: Json
          last_analyzed_at?: string | null
          market_position?: string | null
          organization_id?: string | null
          target_audience?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_intelligence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          guide_data: Json
          hidden_sections: string[] | null
          id: string
          is_favorite: boolean | null
          is_public: boolean
          name: string
          organization_id: string | null
          section_order: string[] | null
          slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guide_data?: Json
          hidden_sections?: string[] | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean
          name: string
          organization_id?: string | null
          section_order?: string[] | null
          slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guide_data?: Json
          hidden_sections?: string[] | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean
          name?: string
          organization_id?: string | null
          section_order?: string[] | null
          slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_guides: {
        Row: {
          brand_id: string | null
          created_at: string
          display_order: number
          gradient_class: string | null
          id: string
          industry_label: string | null
          is_featured: boolean
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          display_order?: number
          gradient_class?: string | null
          id?: string
          industry_label?: string | null
          is_featured?: boolean
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          display_order?: number
          gradient_class?: string | null
          id?: string
          industry_label?: string | null
          is_featured?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_guides_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          guide_data: Json | null
          hidden_sections: string[] | null
          id: string
          is_favorite: boolean | null
          is_public: boolean | null
          name: string
          organization_id: string | null
          parent_brand_id: string | null
          section_order: string[] | null
          slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guide_data?: Json | null
          hidden_sections?: string[] | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          name: string
          organization_id?: string | null
          parent_brand_id?: string | null
          section_order?: string[] | null
          slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guide_data?: Json | null
          hidden_sections?: string[] | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean | null
          name?: string
          organization_id?: string | null
          parent_brand_id?: string | null
          section_order?: string[] | null
          slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_brand_id_fkey"
            columns: ["parent_brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_icon_libraries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          icons: Json
          id: string
          is_active: boolean
          level: string
          name: string
          organization_id: string
          parent_library_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          icons?: Json
          id?: string
          is_active?: boolean
          level?: string
          name: string
          organization_id: string
          parent_library_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          icons?: Json
          id?: string
          is_active?: boolean
          level?: string
          name?: string
          organization_id?: string
          parent_library_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_icon_libraries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_icon_libraries_parent_library_id_fkey"
            columns: ["parent_library_id"]
            isOneToOne: false
            referencedRelation: "organization_icon_libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invite_accepted_at: string | null
          invite_expires_at: string | null
          invite_token: string | null
          invited_email: string | null
          organization_id: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invite_accepted_at?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_email?: string | null
          organization_id: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invite_accepted_at?: string | null
          invite_expires_at?: string | null
          invite_token?: string | null
          invited_email?: string | null
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          accent_color: string | null
          created_at: string
          created_by: string | null
          custom_domain: string | null
          email_from_address: string | null
          email_from_name: string | null
          favicon_url: string | null
          features: Json | null
          hide_platform_branding: boolean | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          portal_settings: Json | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          email_from_address?: string | null
          email_from_name?: string | null
          favicon_url?: string | null
          features?: Json | null
          hide_platform_branding?: boolean | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          portal_settings?: Json | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          created_by?: string | null
          custom_domain?: string | null
          email_from_address?: string | null
          email_from_name?: string | null
          favicon_url?: string | null
          features?: Json | null
          hide_platform_branding?: boolean | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          portal_settings?: Json | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          page_path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          guide_data: Json
          hidden_sections: string[] | null
          id: string
          is_favorite: boolean | null
          is_public: boolean
          is_suite_master: boolean
          name: string
          organization_id: string | null
          parent_brand_id: string | null
          section_order: string[] | null
          slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guide_data?: Json
          hidden_sections?: string[] | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean
          is_suite_master?: boolean
          name: string
          organization_id?: string | null
          parent_brand_id?: string | null
          section_order?: string[] | null
          slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guide_data?: Json
          hidden_sections?: string[] | null
          id?: string
          is_favorite?: boolean | null
          is_public?: boolean
          is_suite_master?: boolean
          name?: string
          organization_id?: string | null
          parent_brand_id?: string | null
          section_order?: string[] | null
          slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_parent_brand_id_fkey"
            columns: ["parent_brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_approved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_report_prompts: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string | null
          prompt: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id?: string | null
          prompt: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string | null
          prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_report_prompts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      universe_backups: {
        Row: {
          backup_data: Json
          backup_name: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          organization_id: string | null
          universe_name: string
          universe_type: string
          updated_at: string
        }
        Insert: {
          backup_data?: Json
          backup_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          organization_id?: string | null
          universe_name: string
          universe_type: string
          updated_at?: string
        }
        Update: {
          backup_data?: Json
          backup_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          organization_id?: string | null
          universe_name?: string
          universe_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "universe_backups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          is_active: boolean | null
          page_count: number | null
          session_id: string
          started_at: string
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          page_count?: number | null
          session_id: string
          started_at?: string
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          page_count?: number | null
          session_id?: string
          started_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      audit_logs_safe: {
        Row: {
          action_type: string | null
          brand_id: string | null
          created_at: string | null
          details: Json | null
          entity_name: string | null
          entity_type: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          action_type?: string | null
          brand_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string | null
          brand_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_delete_user: { Args: { target_user_id: string }; Returns: boolean }
      cleanup_expired_invites: { Args: never; Returns: number }
      cleanup_old_audit_logs: { Args: never; Returns: number }
      generate_slug: { Args: { name: string }; Returns: string }
      get_admin_user_stats: {
        Args: { p_days?: number }
        Returns: {
          active_users: number
          avg_session_duration: number
          most_viewed_entity_name: string
          most_viewed_entity_type: string
          new_users: number
          total_page_views: number
          total_sessions: number
          total_users: number
        }[]
      }
      get_auth_email: { Args: never; Returns: string }
      get_external_top_content: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          avg_duration: number
          entity_id: string
          entity_name: string
          entity_type: string
          unique_viewers: number
          view_count: number
        }[]
      }
      get_external_viewer_stats: {
        Args: { p_days?: number }
        Returns: {
          anonymous_views: number
          avg_duration: number
          total_views: number
          unique_viewers: number
        }[]
      }
      get_external_viewer_trends: {
        Args: { p_days?: number }
        Returns: {
          unique_users: number
          view_count: number
          view_date: string
        }[]
      }
      get_organization_members_safe: {
        Args: { p_org_id: string }
        Returns: {
          created_at: string
          id: string
          invite_accepted_at: string
          invite_expires_at: string
          invited_email: string
          organization_id: string
          role: string
          user_id: string
        }[]
      }
      get_page_view_trends: {
        Args: { p_days?: number }
        Returns: {
          unique_users: number
          view_count: number
          view_date: string
        }[]
      }
      get_portal_org_safe: {
        Args: { p_slug: string }
        Returns: {
          accent_color: string
          id: string
          logo_url: string
          name: string
          portal_settings: Json
          primary_color: string
          secondary_color: string
          slug: string
        }[]
      }
      get_public_brand_data: {
        Args: { p_org_id?: string; p_slug?: string }
        Returns: {
          created_at: string
          guide_data: Json
          id: string
          is_public: boolean
          name: string
          slug: string
          updated_at: string
        }[]
      }
      get_public_event_data: {
        Args: { p_org_id?: string; p_slug?: string }
        Returns: {
          created_at: string
          guide_data: Json
          id: string
          is_public: boolean
          name: string
          slug: string
          updated_at: string
        }[]
      }
      get_public_organization_info: {
        Args: { _org_id?: string; _slug?: string }
        Returns: {
          accent_color: string
          favicon_url: string
          id: string
          logo_url: string
          name: string
          primary_color: string
          secondary_color: string
          slug: string
        }[]
      }
      get_public_portal_org: {
        Args: { p_slug: string }
        Returns: {
          accent_color: string
          favicon_url: string
          id: string
          logo_url: string
          name: string
          portal_settings: Json
          primary_color: string
          secondary_color: string
          slug: string
        }[]
      }
      get_public_product_data: {
        Args: { p_org_id?: string; p_slug?: string }
        Returns: {
          created_at: string
          guide_data: Json
          id: string
          is_public: boolean
          name: string
          slug: string
          updated_at: string
        }[]
      }
      get_top_viewed_content: {
        Args: { p_days?: number; p_limit?: number }
        Returns: {
          avg_duration: number
          entity_id: string
          entity_name: string
          entity_type: string
          unique_viewers: number
          view_count: number
        }[]
      }
      get_user_activity_breakdown: {
        Args: { p_days?: number }
        Returns: {
          last_active: string
          most_viewed_type: string
          page_views: number
          sessions: number
          total_time_seconds: number
          user_email: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_audit_log: {
        Args: {
          p_action_type?: string
          p_brand_id?: string
          p_details?: Json
          p_entity_name?: string
          p_entity_type?: string
        }
        Returns: string
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_slug_taken: { Args: { check_slug: string }; Returns: boolean }
      is_valid_invite_token: {
        Args: { p_token: string }
        Returns: {
          invited_email: string
          invited_role: string
          is_valid: boolean
          org_name: string
        }[]
      }
      org_has_public_brands: { Args: { _org_id: string }; Returns: boolean }
      validate_and_accept_invite: {
        Args: { p_invite_token: string; p_user_id: string }
        Returns: {
          member_id: string
          member_role: string
          org_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
