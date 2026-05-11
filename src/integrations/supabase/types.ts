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
      assistant_memory: {
        Row: {
          conversation_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          key_decisions: Json | null
          organization_id: string
          summary: string
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          key_decisions?: Json | null
          organization_id: string
          summary: string
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          key_decisions?: Json | null
          organization_id?: string
          summary?: string
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_memory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          brand_id: string
          browser: string | null
          created_at: string
          details: Json | null
          device_type: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          organization_id: string | null
          outcome: string | null
          session_id: string | null
          target_user_email: string | null
          target_user_id: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action_type?: string
          brand_id: string
          browser?: string | null
          created_at?: string
          details?: Json | null
          device_type?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          outcome?: string | null
          session_id?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          brand_id?: string
          browser?: string | null
          created_at?: string
          details?: Json | null
          device_type?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          outcome?: string | null
          session_id?: string | null
          target_user_email?: string | null
          target_user_id?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      backup_jobs: {
        Row: {
          backup_path: string | null
          brands_count: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          events_count: number | null
          file_size_bytes: number | null
          id: string
          job_type: string
          organization_id: string
          products_count: number | null
          scheduled_for: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          backup_path?: string | null
          brands_count?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          events_count?: number | null
          file_size_bytes?: number | null
          id?: string
          job_type?: string
          organization_id: string
          products_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          backup_path?: string | null
          brands_count?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          events_count?: number | null
          file_size_bytes?: number | null
          id?: string
          job_type?: string
          organization_id?: string
          products_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bias_awareness_scans: {
        Row: {
          accessibility_analysis: Json | null
          accessibility_score: number | null
          ai_governance_analysis: Json | null
          ai_governance_score: number | null
          color_accessibility_module: Json | null
          color_strategy_module: Json | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          curb_cut_module: Json | null
          entity_id: string
          entity_name: string
          entity_type: string
          error_message: string | null
          findings: Json | null
          id: string
          inclusion_checklist_module: Json | null
          inclusion_score: number | null
          inclusive_imagery_module: Json | null
          language_analysis: Json | null
          language_audit: Json | null
          language_score: number | null
          organization_id: string
          persona_coverage: Json | null
          pie_module: Json | null
          policy_as_code_module: Json | null
          recommendations: Json | null
          sacm_module: Json | null
          status: string
          updated_at: string
          visual_analysis: Json | null
          visual_score: number | null
          wcag_compliance: Json | null
          wfa_module: Json | null
        }
        Insert: {
          accessibility_analysis?: Json | null
          accessibility_score?: number | null
          ai_governance_analysis?: Json | null
          ai_governance_score?: number | null
          color_accessibility_module?: Json | null
          color_strategy_module?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          curb_cut_module?: Json | null
          entity_id: string
          entity_name: string
          entity_type?: string
          error_message?: string | null
          findings?: Json | null
          id?: string
          inclusion_checklist_module?: Json | null
          inclusion_score?: number | null
          inclusive_imagery_module?: Json | null
          language_analysis?: Json | null
          language_audit?: Json | null
          language_score?: number | null
          organization_id: string
          persona_coverage?: Json | null
          pie_module?: Json | null
          policy_as_code_module?: Json | null
          recommendations?: Json | null
          sacm_module?: Json | null
          status?: string
          updated_at?: string
          visual_analysis?: Json | null
          visual_score?: number | null
          wcag_compliance?: Json | null
          wfa_module?: Json | null
        }
        Update: {
          accessibility_analysis?: Json | null
          accessibility_score?: number | null
          ai_governance_analysis?: Json | null
          ai_governance_score?: number | null
          color_accessibility_module?: Json | null
          color_strategy_module?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          curb_cut_module?: Json | null
          entity_id?: string
          entity_name?: string
          entity_type?: string
          error_message?: string | null
          findings?: Json | null
          id?: string
          inclusion_checklist_module?: Json | null
          inclusion_score?: number | null
          inclusive_imagery_module?: Json | null
          language_analysis?: Json | null
          language_audit?: Json | null
          language_score?: number | null
          organization_id?: string
          persona_coverage?: Json | null
          pie_module?: Json | null
          policy_as_code_module?: Json | null
          recommendations?: Json | null
          sacm_module?: Json | null
          status?: string
          updated_at?: string
          visual_analysis?: Json | null
          visual_score?: number | null
          wcag_compliance?: Json | null
          wfa_module?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bias_awareness_scans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      booth_3d_mappings: {
        Row: {
          assignments: Json
          created_at: string
          created_by: string | null
          division_id: string
          id: string
          layout: string
          lighting_preset: string
          show_dimensions: boolean
          show_labels: boolean
          updated_at: string
          uploaded_specs: Json
          variant_label: string
        }
        Insert: {
          assignments?: Json
          created_at?: string
          created_by?: string | null
          division_id: string
          id?: string
          layout?: string
          lighting_preset?: string
          show_dimensions?: boolean
          show_labels?: boolean
          updated_at?: string
          uploaded_specs?: Json
          variant_label?: string
        }
        Update: {
          assignments?: Json
          created_at?: string
          created_by?: string | null
          division_id?: string
          id?: string
          layout?: string
          lighting_preset?: string
          show_dimensions?: boolean
          show_labels?: boolean
          updated_at?: string
          uploaded_specs?: Json
          variant_label?: string
        }
        Relationships: []
      }
      booth_ai_analyses: {
        Row: {
          analysis_data: Json
          created_at: string
          created_by: string | null
          division_id: string
          id: string
          improvements: Json | null
          overall_score: number | null
          recommendations: Json | null
          strengths: Json | null
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          analysis_data?: Json
          created_at?: string
          created_by?: string | null
          division_id: string
          id?: string
          improvements?: Json | null
          overall_score?: number | null
          recommendations?: Json | null
          strengths?: Json | null
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          created_by?: string | null
          division_id?: string
          id?: string
          improvements?: Json | null
          overall_score?: number | null
          recommendations?: Json | null
          strengths?: Json | null
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_brand_presets: {
        Row: {
          accent_color: string | null
          brand_id: string | null
          created_at: string
          created_by: string | null
          display_order: number
          division_id: string
          headline: string | null
          id: string
          logo_url: string | null
          messaging: Json | null
          overrides: Json | null
          panel_graphics: Json | null
          preset_name: string
          primary_color: string | null
          screen_content: Json | null
          secondary_color: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id: string
          headline?: string | null
          id?: string
          logo_url?: string | null
          messaging?: Json | null
          overrides?: Json | null
          panel_graphics?: Json | null
          preset_name: string
          primary_color?: string | null
          screen_content?: Json | null
          secondary_color?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id?: string
          headline?: string | null
          id?: string
          logo_url?: string | null
          messaging?: Json | null
          overrides?: Json | null
          panel_graphics?: Json | null
          preset_name?: string
          primary_color?: string | null
          screen_content?: Json | null
          secondary_color?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booth_brand_presets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      booth_color_analyses: {
        Row: {
          accessibility_score: number | null
          analysis_data: Json
          colors: string[]
          created_at: string
          created_by: string | null
          division_id: string
          id: string
          overall_score: number | null
          production_score: number | null
          psychology_data: Json | null
          recommendations: Json | null
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          accessibility_score?: number | null
          analysis_data?: Json
          colors?: string[]
          created_at?: string
          created_by?: string | null
          division_id: string
          id?: string
          overall_score?: number | null
          production_score?: number | null
          psychology_data?: Json | null
          recommendations?: Json | null
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          accessibility_score?: number | null
          analysis_data?: Json
          colors?: string[]
          created_at?: string
          created_by?: string | null
          division_id?: string
          id?: string
          overall_score?: number | null
          production_score?: number | null
          psychology_data?: Json | null
          recommendations?: Json | null
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_color_palettes: {
        Row: {
          colors: string[]
          created_at: string
          created_by: string | null
          division_id: string
          id: string
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          colors?: string[]
          created_at?: string
          created_by?: string | null
          division_id: string
          id?: string
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          colors?: string[]
          created_at?: string
          created_by?: string | null
          division_id?: string
          id?: string
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_content_sections: {
        Row: {
          bullets: string[]
          created_at: string
          created_by: string | null
          display_order: number
          division_id: string
          heading: string
          id: string
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          bullets?: string[]
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id: string
          heading: string
          id?: string
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          bullets?: string[]
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id?: string
          heading?: string
          id?: string
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_custom_divisions: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          description: string
          display_order: number
          division_id: string
          email: string
          icon_name: string
          id: string
          name: string
          services: string[]
          tagline: string
          updated_at: string
          website: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          division_id: string
          email?: string
          icon_name?: string
          id?: string
          name: string
          services?: string[]
          tagline?: string
          updated_at?: string
          website?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          division_id?: string
          email?: string
          icon_name?: string
          id?: string
          name?: string
          services?: string[]
          tagline?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      booth_download_links: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          division_id: string
          id: string
          label: string
          link_type: string
          updated_at: string
          url: string
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id: string
          id?: string
          label: string
          link_type?: string
          updated_at?: string
          url: string
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id?: string
          id?: string
          label?: string
          link_type?: string
          updated_at?: string
          url?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_gallery_photos: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          display_order: number | null
          division_id: string
          id: string
          image_url: string
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          division_id: string
          id?: string
          image_url: string
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          division_id?: string
          id?: string
          image_url?: string
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_images: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          division_id: string
          id: string
          image_url: string
          updated_at: string
          variant_label: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id: string
          id?: string
          image_url: string
          updated_at?: string
          variant_label: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id?: string
          id?: string
          image_url?: string
          updated_at?: string
          variant_label?: string
        }
        Relationships: []
      }
      booth_key_stats: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          division_id: string
          icon_svg: string | null
          id: string
          label: string
          updated_at: string
          value: string
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id: string
          icon_svg?: string | null
          id?: string
          label: string
          updated_at?: string
          value: string
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id?: string
          icon_svg?: string | null
          id?: string
          label?: string
          updated_at?: string
          value?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_production_specs: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          display_order: number
          division_id: string
          id: string
          title: string
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id: string
          id?: string
          title: string
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id?: string
          id?: string
          title?: string
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_qr_codes: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          division_id: string
          id: string
          image_url: string | null
          label: string
          updated_at: string
          url: string
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id: string
          id?: string
          image_url?: string | null
          label: string
          updated_at?: string
          url: string
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id?: string
          id?: string
          image_url?: string | null
          label?: string
          updated_at?: string
          url?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_section_analyses: {
        Row: {
          analysis_data: Json
          created_at: string
          created_by: string | null
          division_id: string
          id: string
          improvements: Json | null
          overall_score: number | null
          section_heading: string
          section_id: string
          strengths: Json | null
          updated_at: string
        }
        Insert: {
          analysis_data?: Json
          created_at?: string
          created_by?: string | null
          division_id: string
          id?: string
          improvements?: Json | null
          overall_score?: number | null
          section_heading: string
          section_id: string
          strengths?: Json | null
          updated_at?: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          created_by?: string | null
          division_id?: string
          id?: string
          improvements?: Json | null
          overall_score?: number | null
          section_heading?: string
          section_id?: string
          strengths?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booth_section_analyses_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "booth_content_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      booth_services: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          division_id: string
          icon_svg: string | null
          id: string
          label: string
          updated_at: string
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id: string
          icon_svg?: string | null
          id?: string
          label: string
          updated_at?: string
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          division_id?: string
          icon_svg?: string | null
          id?: string
          label?: string
          updated_at?: string
          variant_label?: string | null
        }
        Relationships: []
      }
      booth_system_event_links: {
        Row: {
          created_at: string
          created_by: string | null
          division_id: string | null
          event_id: string
          id: string
          notes: string | null
          override_data: Json | null
          system_id: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          division_id?: string | null
          event_id: string
          id?: string
          notes?: string | null
          override_data?: Json | null
          system_id: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          division_id?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          override_data?: Json | null
          system_id?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booth_system_event_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booth_system_event_links_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "booth_systems"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booth_system_event_links_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "booth_system_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      booth_system_variants: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          dimensions: string | null
          display_order: number
          id: string
          snapshot_data: Json
          system_id: string
          updated_at: string
          variant_name: string
          variant_type: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          dimensions?: string | null
          display_order?: number
          id?: string
          snapshot_data?: Json
          system_id: string
          updated_at?: string
          variant_name: string
          variant_type?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          dimensions?: string | null
          display_order?: number
          id?: string
          snapshot_data?: Json
          system_id?: string
          updated_at?: string
          variant_name?: string
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "booth_system_variants_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "booth_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      booth_systems: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booth_systems_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      booth_variant_info: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          details: Json | null
          display_order: number
          division_id: string
          id: string
          tagline: string | null
          updated_at: string
          variant_label: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          details?: Json | null
          display_order?: number
          division_id: string
          id?: string
          tagline?: string | null
          updated_at?: string
          variant_label: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          details?: Json | null
          display_order?: number
          division_id?: string
          id?: string
          tagline?: string | null
          updated_at?: string
          variant_label?: string
        }
        Relationships: []
      }
      bot_config: {
        Row: {
          bot_type: string
          brand_id: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model: string
          organization_id: string | null
          personality_traits: Json | null
          response_style: string | null
          suggested_questions: Json | null
          system_prompt: string | null
          temperature: number | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          bot_type: string
          brand_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string
          organization_id?: string | null
          personality_traits?: Json | null
          response_style?: string | null
          suggested_questions?: Json | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          bot_type?: string
          brand_id?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string
          organization_id?: string | null
          personality_traits?: Json | null
          response_style?: string | null
          suggested_questions?: Json | null
          system_prompt?: string | null
          temperature?: number | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bot_config_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_conversations: {
        Row: {
          bias_flagged_count: number | null
          bias_flags: Json | null
          bot_type: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          language_code: string | null
          message_count: number | null
          messages: Json
          organization_id: string | null
          satisfaction_rating: number | null
          session_duration_seconds: number | null
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          bias_flagged_count?: number | null
          bias_flags?: Json | null
          bot_type: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          language_code?: string | null
          message_count?: number | null
          messages?: Json
          organization_id?: string | null
          satisfaction_rating?: number | null
          session_duration_seconds?: number | null
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          bias_flagged_count?: number | null
          bias_flags?: Json | null
          bot_type?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          language_code?: string | null
          message_count?: number | null
          messages?: Json
          organization_id?: string | null
          satisfaction_rating?: number | null
          session_duration_seconds?: number | null
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_country_mappings: {
        Row: {
          business_context: Json | null
          country_code: string
          country_name: string
          created_at: string | null
          cultural_notes: Json | null
          default_language: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          region_code: string
          updated_at: string | null
        }
        Insert: {
          business_context?: Json | null
          country_code: string
          country_name: string
          created_at?: string | null
          cultural_notes?: Json | null
          default_language?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          region_code: string
          updated_at?: string | null
        }
        Update: {
          business_context?: Json | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          cultural_notes?: Json | null
          default_language?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          region_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_country_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_design_tokens: {
        Row: {
          created_at: string | null
          created_by: string | null
          css_output: string | null
          entity_id: string
          entity_type: string
          format: string
          id: string
          include_colors: boolean | null
          include_shadows: boolean | null
          include_spacing: boolean | null
          include_typography: boolean | null
          name: string
          organization_id: string | null
          prefix: string | null
          tokens_data: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          css_output?: string | null
          entity_id: string
          entity_type?: string
          format?: string
          id?: string
          include_colors?: boolean | null
          include_shadows?: boolean | null
          include_spacing?: boolean | null
          include_typography?: boolean | null
          name?: string
          organization_id?: string | null
          prefix?: string | null
          tokens_data?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          css_output?: string | null
          entity_id?: string
          entity_type?: string
          format?: string
          id?: string
          include_colors?: boolean | null
          include_shadows?: boolean | null
          include_spacing?: boolean | null
          include_typography?: boolean | null
          name?: string
          organization_id?: string | null
          prefix?: string | null
          tokens_data?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_design_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_generated_assets: {
        Row: {
          aspect_ratio: string | null
          asset_type: string
          category: string
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          generation_params: Json | null
          id: string
          image_url: string | null
          is_approved: boolean | null
          is_published: boolean | null
          model_used: string | null
          name: string
          organization_id: string | null
          prompt_id: string | null
          prompt_used: string
          rating: number | null
          thumbnail_url: string | null
        }
        Insert: {
          aspect_ratio?: string | null
          asset_type?: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type?: string
          generation_params?: Json | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_published?: boolean | null
          model_used?: string | null
          name: string
          organization_id?: string | null
          prompt_id?: string | null
          prompt_used: string
          rating?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          aspect_ratio?: string | null
          asset_type?: string
          category?: string
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          generation_params?: Json | null
          id?: string
          image_url?: string | null
          is_approved?: boolean | null
          is_published?: boolean | null
          model_used?: string | null
          name?: string
          organization_id?: string | null
          prompt_id?: string | null
          prompt_used?: string
          rating?: number | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_generated_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_generated_assets_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "brand_prompt_library"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_intelligence: {
        Row: {
          analysis_count: number
          analysis_history: Json
          bias_awareness_profile: Json | null
          brand_summary: string | null
          brand_voice_profile: Json | null
          competitive_advantages: Json | null
          competitive_landscape: Json | null
          confidence_history: Json | null
          created_at: string
          created_by: string | null
          cultural_insights: Json | null
          decay_config: Json | null
          entity_id: string
          entity_type: string
          feedback_score: number | null
          globallink_recommendations: Json | null
          growth_recommendations: Json | null
          id: string
          insight_actions: Json | null
          insight_feedback: Json | null
          knowledge_entries: Json
          last_analyzed_at: string | null
          learning_context: Json | null
          localization_readiness_score: number | null
          market_position: string | null
          organization_id: string | null
          parent_entity_id: string | null
          regional_adaptations: Json | null
          semantic_hashes: Json | null
          target_audience: Json | null
          updated_at: string
        }
        Insert: {
          analysis_count?: number
          analysis_history?: Json
          bias_awareness_profile?: Json | null
          brand_summary?: string | null
          brand_voice_profile?: Json | null
          competitive_advantages?: Json | null
          competitive_landscape?: Json | null
          confidence_history?: Json | null
          created_at?: string
          created_by?: string | null
          cultural_insights?: Json | null
          decay_config?: Json | null
          entity_id: string
          entity_type: string
          feedback_score?: number | null
          globallink_recommendations?: Json | null
          growth_recommendations?: Json | null
          id?: string
          insight_actions?: Json | null
          insight_feedback?: Json | null
          knowledge_entries?: Json
          last_analyzed_at?: string | null
          learning_context?: Json | null
          localization_readiness_score?: number | null
          market_position?: string | null
          organization_id?: string | null
          parent_entity_id?: string | null
          regional_adaptations?: Json | null
          semantic_hashes?: Json | null
          target_audience?: Json | null
          updated_at?: string
        }
        Update: {
          analysis_count?: number
          analysis_history?: Json
          bias_awareness_profile?: Json | null
          brand_summary?: string | null
          brand_voice_profile?: Json | null
          competitive_advantages?: Json | null
          competitive_landscape?: Json | null
          confidence_history?: Json | null
          created_at?: string
          created_by?: string | null
          cultural_insights?: Json | null
          decay_config?: Json | null
          entity_id?: string
          entity_type?: string
          feedback_score?: number | null
          globallink_recommendations?: Json | null
          growth_recommendations?: Json | null
          id?: string
          insight_actions?: Json | null
          insight_feedback?: Json | null
          knowledge_entries?: Json
          last_analyzed_at?: string | null
          learning_context?: Json | null
          localization_readiness_score?: number | null
          market_position?: string | null
          organization_id?: string | null
          parent_entity_id?: string | null
          regional_adaptations?: Json | null
          semantic_hashes?: Json | null
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
      brand_intelligence_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          organization_id: string | null
          progress: number | null
          result: Json | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          organization_id?: string | null
          progress?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          organization_id?: string | null
          progress?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_intelligence_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_prompt_library: {
        Row: {
          aspect_ratio: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          last_used_at: string | null
          name: string
          organization_id: string | null
          output_format: string | null
          prompt_template: string
          style_preset: string | null
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_id: string
          entity_type?: string
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          last_used_at?: string | null
          name: string
          organization_id?: string | null
          output_format?: string | null
          prompt_template: string
          style_preset?: string | null
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          last_used_at?: string | null
          name?: string
          organization_id?: string | null
          output_format?: string | null
          prompt_template?: string
          style_preset?: string | null
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_prompt_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_regional_variants: {
        Row: {
          adaptation_notes: string | null
          approved_at: string | null
          approved_by: string | null
          colors_override: Json | null
          created_at: string | null
          created_by: string | null
          cultural_adaptations: Json | null
          custom_sections_override: Json | null
          entity_id: string
          entity_type: string
          globallink_job_id: string | null
          gradients_override: Json | null
          hero_override: Json | null
          id: string
          identity_override: Json | null
          imagery_override: Json | null
          last_synced_at: string | null
          logos_override: Json | null
          messaging_override: Json | null
          organization_id: string | null
          parent_variant_id: string | null
          patterns_override: Json | null
          published_at: string | null
          translation_status: string | null
          typography_override: Json | null
          updated_at: string | null
          variant_code: string
          variant_level: string
          voice_override: Json | null
        }
        Insert: {
          adaptation_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          colors_override?: Json | null
          created_at?: string | null
          created_by?: string | null
          cultural_adaptations?: Json | null
          custom_sections_override?: Json | null
          entity_id: string
          entity_type: string
          globallink_job_id?: string | null
          gradients_override?: Json | null
          hero_override?: Json | null
          id?: string
          identity_override?: Json | null
          imagery_override?: Json | null
          last_synced_at?: string | null
          logos_override?: Json | null
          messaging_override?: Json | null
          organization_id?: string | null
          parent_variant_id?: string | null
          patterns_override?: Json | null
          published_at?: string | null
          translation_status?: string | null
          typography_override?: Json | null
          updated_at?: string | null
          variant_code: string
          variant_level: string
          voice_override?: Json | null
        }
        Update: {
          adaptation_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          colors_override?: Json | null
          created_at?: string | null
          created_by?: string | null
          cultural_adaptations?: Json | null
          custom_sections_override?: Json | null
          entity_id?: string
          entity_type?: string
          globallink_job_id?: string | null
          gradients_override?: Json | null
          hero_override?: Json | null
          id?: string
          identity_override?: Json | null
          imagery_override?: Json | null
          last_synced_at?: string | null
          logos_override?: Json | null
          messaging_override?: Json | null
          organization_id?: string | null
          parent_variant_id?: string | null
          patterns_override?: Json | null
          published_at?: string | null
          translation_status?: string | null
          typography_override?: Json | null
          updated_at?: string | null
          variant_code?: string
          variant_level?: string
          voice_override?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_regional_variants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_regional_variants_parent_variant_id_fkey"
            columns: ["parent_variant_id"]
            isOneToOne: false
            referencedRelation: "brand_regional_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_regions: {
        Row: {
          code: string
          created_at: string | null
          cultural_context: Json | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          parent_region_code: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          cultural_context?: Json | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          parent_region_code?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          cultural_context?: Json | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          parent_region_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_regions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_visibility_audits: {
        Row: {
          ai_platform_analysis: Json | null
          ai_platform_score: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          error_message: string | null
          id: string
          organization_id: string | null
          overall_visibility_score: number | null
          recommendations: Json | null
          search_analysis: Json | null
          search_visibility_score: number | null
          social_media_analysis: Json | null
          social_media_score: number | null
          status: string
          updated_at: string
          visibility_gaps: Json | null
          websites_analyzed: string[] | null
        }
        Insert: {
          ai_platform_analysis?: Json | null
          ai_platform_score?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_name: string
          entity_type?: string
          error_message?: string | null
          id?: string
          organization_id?: string | null
          overall_visibility_score?: number | null
          recommendations?: Json | null
          search_analysis?: Json | null
          search_visibility_score?: number | null
          social_media_analysis?: Json | null
          social_media_score?: number | null
          status?: string
          updated_at?: string
          visibility_gaps?: Json | null
          websites_analyzed?: string[] | null
        }
        Update: {
          ai_platform_analysis?: Json | null
          ai_platform_score?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_name?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          organization_id?: string | null
          overall_visibility_score?: number | null
          recommendations?: Json | null
          search_analysis?: Json | null
          search_visibility_score?: number | null
          social_media_analysis?: Json | null
          social_media_score?: number | null
          status?: string
          updated_at?: string
          visibility_gaps?: Json | null
          websites_analyzed?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_visibility_audits_organization_id_fkey"
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
          share_token: string | null
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
          share_token?: string | null
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
          share_token?: string | null
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
      color_lab_reports: {
        Row: {
          colors: Json
          created_at: string
          id: string
          report_data: Json
          report_type: string
          share_token: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          id?: string
          report_data?: Json
          report_type?: string
          share_token?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          colors?: Json
          created_at?: string
          id?: string
          report_data?: Json
          report_type?: string
          share_token?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_locations: {
        Row: {
          address: string | null
          category: string | null
          city: string
          country: string
          created_at: string
          display_order: number
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          region: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          city: string
          country: string
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          region: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string
          country?: string
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          region?: string
          updated_at?: string
        }
        Relationships: []
      }
      competitive_analysis_reports: {
        Row: {
          competitors: Json | null
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          organization_id: string | null
          report_data: Json
          report_type: string
          score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          competitors?: Json | null
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          organization_id?: string | null
          report_data: Json
          report_type?: string
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          competitors?: Json | null
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string | null
          report_data?: Json
          report_type?: string
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitive_analysis_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitive_recommendation_actions: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          applied_to_imagery_hub: boolean
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          organization_id: string | null
          recommendation_index: number
          recommendation_title: string
          recommendation_type: string
          report_id: string
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          applied_to_imagery_hub?: boolean
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          recommendation_index: number
          recommendation_title: string
          recommendation_type?: string
          report_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          applied_to_imagery_hub?: boolean
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          recommendation_index?: number
          recommendation_title?: string
          recommendation_type?: string
          report_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitive_recommendation_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitive_recommendation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "competitive_analysis_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      dataforce_assistant_conversations: {
        Row: {
          bias_flagged_count: number | null
          bias_flags: Json | null
          context_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          language_code: string | null
          messages: Json | null
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bias_flagged_count?: number | null
          bias_flags?: Json | null
          context_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          language_code?: string | null
          messages?: Json | null
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bias_flagged_count?: number | null
          bias_flags?: Json | null
          context_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          language_code?: string | null
          messages?: Json | null
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataforce_assistant_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dataforce_compliance_jobs: {
        Row: {
          assets_scanned: number | null
          completed_at: string | null
          compliance_score: number | null
          created_at: string
          created_by: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          id: string
          issues_data: Json | null
          issues_found: number | null
          organization_id: string | null
          status: string | null
        }
        Insert: {
          assets_scanned?: number | null
          completed_at?: string | null
          compliance_score?: number | null
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          id?: string
          issues_data?: Json | null
          issues_found?: number | null
          organization_id?: string | null
          status?: string | null
        }
        Update: {
          assets_scanned?: number | null
          completed_at?: string | null
          compliance_score?: number | null
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_name?: string
          entity_type?: string
          id?: string
          issues_data?: Json | null
          issues_found?: number | null
          organization_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataforce_compliance_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dataforce_config: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          api_mode: string | null
          assistant_languages: string[] | null
          assistant_model_id: string | null
          assistant_persona: string | null
          brand_assistant_enabled: boolean | null
          compliance_ai_enabled: boolean | null
          compliance_auto_scan: boolean | null
          compliance_model_id: string | null
          compliance_threshold: number | null
          created_at: string
          cultural_validation_enabled: boolean | null
          genai_training_enabled: boolean | null
          id: string
          organization_id: string | null
          training_last_sync_at: string | null
          training_model_base: string | null
          training_voice_samples: number | null
          updated_at: string
          validation_auto_request: boolean | null
          validation_panel_size: number | null
          validation_regions: string[] | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          api_mode?: string | null
          assistant_languages?: string[] | null
          assistant_model_id?: string | null
          assistant_persona?: string | null
          brand_assistant_enabled?: boolean | null
          compliance_ai_enabled?: boolean | null
          compliance_auto_scan?: boolean | null
          compliance_model_id?: string | null
          compliance_threshold?: number | null
          created_at?: string
          cultural_validation_enabled?: boolean | null
          genai_training_enabled?: boolean | null
          id?: string
          organization_id?: string | null
          training_last_sync_at?: string | null
          training_model_base?: string | null
          training_voice_samples?: number | null
          updated_at?: string
          validation_auto_request?: boolean | null
          validation_panel_size?: number | null
          validation_regions?: string[] | null
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          api_mode?: string | null
          assistant_languages?: string[] | null
          assistant_model_id?: string | null
          assistant_persona?: string | null
          brand_assistant_enabled?: boolean | null
          compliance_ai_enabled?: boolean | null
          compliance_auto_scan?: boolean | null
          compliance_model_id?: string | null
          compliance_threshold?: number | null
          created_at?: string
          cultural_validation_enabled?: boolean | null
          genai_training_enabled?: boolean | null
          id?: string
          organization_id?: string | null
          training_last_sync_at?: string | null
          training_model_base?: string | null
          training_voice_samples?: number | null
          updated_at?: string
          validation_auto_request?: boolean | null
          validation_panel_size?: number | null
          validation_regions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "dataforce_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dataforce_training_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metrics: Json | null
          model_id: string | null
          organization_id: string | null
          samples_collected: number | null
          samples_target: number | null
          status: string | null
          training_config: Json | null
          training_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metrics?: Json | null
          model_id?: string | null
          organization_id?: string | null
          samples_collected?: number | null
          samples_target?: number | null
          status?: string | null
          training_config?: Json | null
          training_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metrics?: Json | null
          model_id?: string | null
          organization_id?: string | null
          samples_collected?: number | null
          samples_target?: number | null
          status?: string | null
          training_config?: Json | null
          training_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataforce_training_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dataforce_validation_requests: {
        Row: {
          completed_at: string | null
          content_snapshot: Json | null
          created_at: string
          created_by: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          feedback_summary: Json | null
          id: string
          organization_id: string | null
          panel_size: number | null
          responses_received: number | null
          status: string | null
          target_regions: string[]
          validation_score: number | null
          variant_id: string | null
        }
        Insert: {
          completed_at?: string | null
          content_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          feedback_summary?: Json | null
          id?: string
          organization_id?: string | null
          panel_size?: number | null
          responses_received?: number | null
          status?: string | null
          target_regions: string[]
          validation_score?: number | null
          variant_id?: string | null
        }
        Update: {
          completed_at?: string | null
          content_snapshot?: Json | null
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_name?: string
          entity_type?: string
          feedback_summary?: Json | null
          id?: string
          organization_id?: string | null
          panel_size?: number | null
          responses_received?: number | null
          status?: string | null
          target_regions?: string[]
          validation_score?: number | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataforce_validation_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataforce_validation_requests_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "brand_regional_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_brands: {
        Row: {
          card_image_url: string | null
          created_at: string
          display_order: number
          gradient_class: string | null
          guide_data: Json
          hidden_sections: string[] | null
          id: string
          industry_label: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          page_settings: Json | null
          section_order: string[] | null
          slug: string
          type: string
          updated_at: string
        }
        Insert: {
          card_image_url?: string | null
          created_at?: string
          display_order?: number
          gradient_class?: string | null
          guide_data?: Json
          hidden_sections?: string[] | null
          id?: string
          industry_label?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          page_settings?: Json | null
          section_order?: string[] | null
          slug: string
          type?: string
          updated_at?: string
        }
        Update: {
          card_image_url?: string | null
          created_at?: string
          display_order?: number
          gradient_class?: string | null
          guide_data?: Json
          hidden_sections?: string[] | null
          id?: string
          industry_label?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          page_settings?: Json | null
          section_order?: string[] | null
          slug?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
      expo_booth_analytics: {
        Row: {
          actual_demos_given: number | null
          actual_dwell_time_seconds: number | null
          actual_engagement_rate: number | null
          actual_leads_captured: number | null
          actual_peak_visitors: number | null
          actual_traffic_estimate: number | null
          created_at: string
          created_by: string | null
          demos_by_station: Json | null
          division_id: string
          engagement_by_zone: Json | null
          event_date: string | null
          event_name: string | null
          id: string
          leads_by_source: Json | null
          notes: string | null
          organization_id: string | null
          predicted_dwell_time_seconds: number | null
          predicted_peak_capacity: number | null
          predicted_traffic: number | null
          predicted_visibility_score: number | null
          simulation_data: Json | null
          top_performing_panels: Json | null
          traffic_by_hour: Json | null
          updated_at: string
          variant_label: string
        }
        Insert: {
          actual_demos_given?: number | null
          actual_dwell_time_seconds?: number | null
          actual_engagement_rate?: number | null
          actual_leads_captured?: number | null
          actual_peak_visitors?: number | null
          actual_traffic_estimate?: number | null
          created_at?: string
          created_by?: string | null
          demos_by_station?: Json | null
          division_id: string
          engagement_by_zone?: Json | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          leads_by_source?: Json | null
          notes?: string | null
          organization_id?: string | null
          predicted_dwell_time_seconds?: number | null
          predicted_peak_capacity?: number | null
          predicted_traffic?: number | null
          predicted_visibility_score?: number | null
          simulation_data?: Json | null
          top_performing_panels?: Json | null
          traffic_by_hour?: Json | null
          updated_at?: string
          variant_label?: string
        }
        Update: {
          actual_demos_given?: number | null
          actual_dwell_time_seconds?: number | null
          actual_engagement_rate?: number | null
          actual_leads_captured?: number | null
          actual_peak_visitors?: number | null
          actual_traffic_estimate?: number | null
          created_at?: string
          created_by?: string | null
          demos_by_station?: Json | null
          division_id?: string
          engagement_by_zone?: Json | null
          event_date?: string | null
          event_name?: string | null
          id?: string
          leads_by_source?: Json | null
          notes?: string | null
          organization_id?: string | null
          predicted_dwell_time_seconds?: number | null
          predicted_peak_capacity?: number | null
          predicted_traffic?: number | null
          predicted_visibility_score?: number | null
          simulation_data?: Json | null
          top_performing_panels?: Json | null
          traffic_by_hour?: Json | null
          updated_at?: string
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "expo_booth_analytics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expo_booth_placements: {
        Row: {
          booth_number: string | null
          booth_size: string
          category: string | null
          color: string | null
          created_at: string
          created_by: string | null
          division_id: string | null
          floor_plan_id: string
          height: number
          id: string
          is_competitor: boolean | null
          is_own_booth: boolean | null
          label: string
          metadata: Json | null
          notes: string | null
          rotation: number | null
          updated_at: string
          width: number
          x_position: number
          y_position: number
        }
        Insert: {
          booth_number?: string | null
          booth_size?: string
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          division_id?: string | null
          floor_plan_id: string
          height?: number
          id?: string
          is_competitor?: boolean | null
          is_own_booth?: boolean | null
          label: string
          metadata?: Json | null
          notes?: string | null
          rotation?: number | null
          updated_at?: string
          width?: number
          x_position?: number
          y_position?: number
        }
        Update: {
          booth_number?: string | null
          booth_size?: string
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          division_id?: string | null
          floor_plan_id?: string
          height?: number
          id?: string
          is_competitor?: boolean | null
          is_own_booth?: boolean | null
          label?: string
          metadata?: Json | null
          notes?: string | null
          rotation?: number | null
          updated_at?: string
          width?: number
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "expo_booth_placements_floor_plan_id_fkey"
            columns: ["floor_plan_id"]
            isOneToOne: false
            referencedRelation: "expo_floor_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      expo_floor_plans: {
        Row: {
          created_at: string
          created_by: string | null
          dimensions: Json | null
          event_id: string | null
          file_type: string
          file_url: string
          grid_size: number | null
          hall_name: string | null
          id: string
          metadata: Json | null
          name: string
          organization_id: string | null
          scale_factor: number | null
          updated_at: string
          venue_name: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dimensions?: Json | null
          event_id?: string | null
          file_type?: string
          file_url: string
          grid_size?: number | null
          hall_name?: string | null
          id?: string
          metadata?: Json | null
          name: string
          organization_id?: string | null
          scale_factor?: number | null
          updated_at?: string
          venue_name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dimensions?: Json | null
          event_id?: string | null
          file_type?: string
          file_url?: string
          grid_size?: number | null
          hall_name?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          scale_factor?: number | null
          updated_at?: string
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expo_floor_plans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expo_floor_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      expo_floor_zones: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          floor_plan_id: string
          id: string
          intensity: string | null
          label: string
          metadata: Json | null
          opacity: number | null
          points: Json
          updated_at: string
          zone_type: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          floor_plan_id: string
          id?: string
          intensity?: string | null
          label: string
          metadata?: Json | null
          opacity?: number | null
          points?: Json
          updated_at?: string
          zone_type?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          floor_plan_id?: string
          id?: string
          intensity?: string | null
          label?: string
          metadata?: Json | null
          opacity?: number | null
          points?: Json
          updated_at?: string
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "expo_floor_zones_floor_plan_id_fkey"
            columns: ["floor_plan_id"]
            isOneToOne: false
            referencedRelation: "expo_floor_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_competitors: {
        Row: {
          competitor_type: string | null
          created_at: string
          created_by: string | null
          id: string
          industry: string | null
          name: string
          organization_id: string | null
          reason: string | null
          updated_at: string
        }
        Insert: {
          competitor_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          name: string
          organization_id?: string | null
          reason?: string | null
          updated_at?: string
        }
        Update: {
          competitor_type?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          name?: string
          organization_id?: string | null
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_competitors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      global_client_logos: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          files: Json
          id: string
          name: string
          organization_id: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          files?: Json
          id?: string
          name: string
          organization_id: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          files?: Json
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_client_logos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      globallink_config: {
        Row: {
          api_endpoint: string | null
          api_key: string | null
          api_mode: string
          auto_translate_new_content: boolean | null
          callback_url: string | null
          created_at: string
          default_service: string | null
          glossary_enabled: boolean | null
          id: string
          organization_id: string | null
          preserve_formatting: boolean | null
          project_key: string | null
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key?: string | null
          api_mode?: string
          auto_translate_new_content?: boolean | null
          callback_url?: string | null
          created_at?: string
          default_service?: string | null
          glossary_enabled?: boolean | null
          id?: string
          organization_id?: string | null
          preserve_formatting?: boolean | null
          project_key?: string | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string | null
          api_mode?: string
          auto_translate_new_content?: boolean | null
          callback_url?: string | null
          created_at?: string
          default_service?: string | null
          glossary_enabled?: boolean | null
          id?: string
          organization_id?: string | null
          preserve_formatting?: boolean | null
          project_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "globallink_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      globallink_product_config: {
        Row: {
          ai_content_optimization: boolean | null
          ai_cultural_adaptation: boolean | null
          ai_enabled: boolean | null
          ai_model: string | null
          connect_enabled: boolean | null
          connect_project_id: string | null
          connect_workflow_template: string | null
          created_at: string | null
          fluent_embed_key: string | null
          fluent_enabled: boolean | null
          id: string
          organization_id: string | null
          translation_api_key_id: string | null
          translation_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          ai_content_optimization?: boolean | null
          ai_cultural_adaptation?: boolean | null
          ai_enabled?: boolean | null
          ai_model?: string | null
          connect_enabled?: boolean | null
          connect_project_id?: string | null
          connect_workflow_template?: string | null
          created_at?: string | null
          fluent_embed_key?: string | null
          fluent_enabled?: boolean | null
          id?: string
          organization_id?: string | null
          translation_api_key_id?: string | null
          translation_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ai_content_optimization?: boolean | null
          ai_cultural_adaptation?: boolean | null
          ai_enabled?: boolean | null
          ai_model?: string | null
          connect_enabled?: boolean | null
          connect_project_id?: string | null
          connect_workflow_template?: string | null
          created_at?: string | null
          fluent_embed_key?: string | null
          fluent_enabled?: boolean | null
          id?: string
          organization_id?: string | null
          translation_api_key_id?: string | null
          translation_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "globallink_product_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      health_snapshots: {
        Row: {
          bias_details: Json | null
          bias_inclusion_score: number | null
          brand_health_score: number | null
          competitive_details: Json | null
          competitive_score: number | null
          compliance_details: Json | null
          compliance_score: number | null
          created_at: string
          created_by: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          id: string
          organization_id: string
          period_type: string
          score_deltas: Json | null
          snapshot_date: string
          social_metrics: Json | null
          triggered_by: string | null
          updated_at: string
          website_details: Json | null
          website_score: number | null
        }
        Insert: {
          bias_details?: Json | null
          bias_inclusion_score?: number | null
          brand_health_score?: number | null
          competitive_details?: Json | null
          competitive_score?: number | null
          compliance_details?: Json | null
          compliance_score?: number | null
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_name: string
          entity_type?: string
          id?: string
          organization_id: string
          period_type?: string
          score_deltas?: Json | null
          snapshot_date?: string
          social_metrics?: Json | null
          triggered_by?: string | null
          updated_at?: string
          website_details?: Json | null
          website_score?: number | null
        }
        Update: {
          bias_details?: Json | null
          bias_inclusion_score?: number | null
          brand_health_score?: number | null
          competitive_details?: Json | null
          competitive_score?: number | null
          compliance_details?: Json | null
          compliance_score?: number | null
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_name?: string
          entity_type?: string
          id?: string
          organization_id?: string
          period_type?: string
          score_deltas?: Json | null
          snapshot_date?: string
          social_metrics?: Json | null
          triggered_by?: string | null
          updated_at?: string
          website_details?: Json | null
          website_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      icon_library_brand_links: {
        Row: {
          allow_overrides: boolean
          brand_id: string | null
          color_overrides: Json | null
          created_at: string
          created_by: string | null
          entity_type: string
          event_id: string | null
          id: string
          library_id: string
          organization_id: string
          product_id: string | null
        }
        Insert: {
          allow_overrides?: boolean
          brand_id?: string | null
          color_overrides?: Json | null
          created_at?: string
          created_by?: string | null
          entity_type?: string
          event_id?: string | null
          id?: string
          library_id: string
          organization_id: string
          product_id?: string | null
        }
        Update: {
          allow_overrides?: boolean
          brand_id?: string | null
          color_overrides?: Json | null
          created_at?: string
          created_by?: string | null
          entity_type?: string
          event_id?: string | null
          id?: string
          library_id?: string
          organization_id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "icon_library_brand_links_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icon_library_brand_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icon_library_brand_links_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "organization_icon_libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icon_library_brand_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icon_library_brand_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      imagery_preference_signals: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          image_id: string
          image_metadata: Json | null
          organization_id: string | null
          search_context: Json | null
          section_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type?: string
          id?: string
          image_id: string
          image_metadata?: Json | null
          organization_id?: string | null
          search_context?: Json | null
          section_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          image_id?: string
          image_metadata?: Json | null
          organization_id?: string | null
          search_context?: Json | null
          section_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imagery_preference_signals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      imagery_strategy_audits: {
        Row: {
          action_orientation_score: number | null
          authenticity_score: number | null
          created_at: string | null
          created_by: string | null
          cultural_context_score: number | null
          diversity_score: number | null
          entity_id: string
          entity_type: string
          go_signals_present: Json | null
          id: string
          images_analyzed: number | null
          inclusive_prompting_score: number | null
          organization_id: string | null
          overall_score: number | null
          recommendations: Json | null
          stock_dependency: string | null
          stop_signals_detected: Json | null
        }
        Insert: {
          action_orientation_score?: number | null
          authenticity_score?: number | null
          created_at?: string | null
          created_by?: string | null
          cultural_context_score?: number | null
          diversity_score?: number | null
          entity_id: string
          entity_type?: string
          go_signals_present?: Json | null
          id?: string
          images_analyzed?: number | null
          inclusive_prompting_score?: number | null
          organization_id?: string | null
          overall_score?: number | null
          recommendations?: Json | null
          stock_dependency?: string | null
          stop_signals_detected?: Json | null
        }
        Update: {
          action_orientation_score?: number | null
          authenticity_score?: number | null
          created_at?: string | null
          created_by?: string | null
          cultural_context_score?: number | null
          diversity_score?: number | null
          entity_id?: string
          entity_type?: string
          go_signals_present?: Json | null
          id?: string
          images_analyzed?: number | null
          inclusive_prompting_score?: number | null
          organization_id?: string | null
          overall_score?: number | null
          recommendations?: Json | null
          stock_dependency?: string | null
          stop_signals_detected?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "imagery_strategy_audits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      imagery_visual_dna: {
        Row: {
          approval_patterns: Json | null
          avoid_keywords: Json | null
          confidence_score: number | null
          created_at: string
          data_sources: Json | null
          entity_id: string
          entity_type: string
          id: string
          last_analyzed_at: string | null
          mood_keywords: Json | null
          organization_id: string | null
          preferred_categories: Json | null
          preferred_colors: Json | null
          preferred_compositions: Json | null
          preferred_styles: Json | null
          total_approved: number | null
          total_removed: number | null
          total_skipped: number | null
          updated_at: string
        }
        Insert: {
          approval_patterns?: Json | null
          avoid_keywords?: Json | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          entity_id: string
          entity_type?: string
          id?: string
          last_analyzed_at?: string | null
          mood_keywords?: Json | null
          organization_id?: string | null
          preferred_categories?: Json | null
          preferred_colors?: Json | null
          preferred_compositions?: Json | null
          preferred_styles?: Json | null
          total_approved?: number | null
          total_removed?: number | null
          total_skipped?: number | null
          updated_at?: string
        }
        Update: {
          approval_patterns?: Json | null
          avoid_keywords?: Json | null
          confidence_score?: number | null
          created_at?: string
          data_sources?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          last_analyzed_at?: string | null
          mood_keywords?: Json | null
          organization_id?: string | null
          preferred_categories?: Json | null
          preferred_colors?: Json | null
          preferred_compositions?: Json | null
          preferred_styles?: Json | null
          total_approved?: number | null
          total_removed?: number | null
          total_skipped?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imagery_visual_dna_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          message: string
          metadata: Json | null
          organization_id: string
          severity: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          message: string
          metadata?: Json | null
          organization_id: string
          severity?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          organization_id?: string
          severity?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_digests: {
        Row: {
          created_at: string
          created_by: string | null
          data_sources: Json
          digest: string
          generated_at: string
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_sources?: Json
          digest: string
          generated_at?: string
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_sources?: Json
          digest?: string
          generated_at?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_digests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_submissions: {
        Row: {
          admin_notes: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          role: string | null
          status: string
          team_size: string | null
          updated_at: string
          use_case: string | null
        }
        Insert: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Update: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Relationships: []
      }
      localization_cache: {
        Row: {
          context: string | null
          created_at: string
          hit_count: number | null
          id: string
          last_used_at: string | null
          organization_id: string | null
          source_hash: string
          source_language: string
          source_text: string
          target_language: string
          translated_text: string
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          organization_id?: string | null
          source_hash: string
          source_language?: string
          source_text: string
          target_language: string
          translated_text: string
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          hit_count?: number | null
          id?: string
          last_used_at?: string | null
          organization_id?: string | null
          source_hash?: string
          source_language?: string
          source_text?: string
          target_language?: string
          translated_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "localization_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      localization_jobs: {
        Row: {
          character_count: number | null
          completed_at: string | null
          created_at: string
          entity_id: string | null
          entity_name: string
          entity_type: string
          error_message: string | null
          id: string
          organization_id: string | null
          source_content: Json
          source_language: string
          status: string
          submitted_at: string
          submitted_by: string | null
          target_language: string
          translated_content: Json | null
          translation_method: string | null
          updated_at: string
          word_count: number | null
        }
        Insert: {
          character_count?: number | null
          completed_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name: string
          entity_type: string
          error_message?: string | null
          id?: string
          organization_id?: string | null
          source_content: Json
          source_language?: string
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          target_language: string
          translated_content?: Json | null
          translation_method?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          character_count?: number | null
          completed_at?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          organization_id?: string | null
          source_content?: Json
          source_language?: string
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          target_language?: string
          translated_content?: Json | null
          translation_method?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "localization_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      localization_target_languages: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          language_code: string
          language_name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          language_code: string
          language_name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          language_code?: string
          language_name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "localization_target_languages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      localized_content: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          language_code: string
          last_synced_at: string | null
          localized_guide_data: Json
          organization_id: string | null
          published_at: string | null
          published_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          translation_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          language_code: string
          last_synced_at?: string | null
          localized_guide_data: Json
          organization_id?: string | null
          published_at?: string | null
          published_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          translation_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          language_code?: string
          last_synced_at?: string | null
          localized_guide_data?: Json
          organization_id?: string | null
          published_at?: string | null
          published_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          translation_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "localized_content_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      oracle_intelligence: {
        Row: {
          bias_awareness_insights: Json | null
          competitive_overview: Json | null
          confidence_scores: Json | null
          created_at: string
          cross_entity_patterns: Json | null
          cultural_readiness: Json | null
          entity_brain_count: number
          id: string
          knowledge_entry_count: number
          last_synthesis_at: string | null
          longitudinal_trends: Json | null
          market_landscape: Json | null
          org_summary: string | null
          organization_id: string
          portfolio_analysis: Json | null
          strategic_recommendations: Json | null
          synthesis_count: number
          synthesis_history: Json | null
          unified_audience_map: Json | null
          unified_voice_profile: Json | null
          updated_at: string
        }
        Insert: {
          bias_awareness_insights?: Json | null
          competitive_overview?: Json | null
          confidence_scores?: Json | null
          created_at?: string
          cross_entity_patterns?: Json | null
          cultural_readiness?: Json | null
          entity_brain_count?: number
          id?: string
          knowledge_entry_count?: number
          last_synthesis_at?: string | null
          longitudinal_trends?: Json | null
          market_landscape?: Json | null
          org_summary?: string | null
          organization_id: string
          portfolio_analysis?: Json | null
          strategic_recommendations?: Json | null
          synthesis_count?: number
          synthesis_history?: Json | null
          unified_audience_map?: Json | null
          unified_voice_profile?: Json | null
          updated_at?: string
        }
        Update: {
          bias_awareness_insights?: Json | null
          competitive_overview?: Json | null
          confidence_scores?: Json | null
          created_at?: string
          cross_entity_patterns?: Json | null
          cultural_readiness?: Json | null
          entity_brain_count?: number
          id?: string
          knowledge_entry_count?: number
          last_synthesis_at?: string | null
          longitudinal_trends?: Json | null
          market_landscape?: Json | null
          org_summary?: string | null
          organization_id?: string
          portfolio_analysis?: Json | null
          strategic_recommendations?: Json | null
          synthesis_count?: number
          synthesis_history?: Json | null
          unified_audience_map?: Json | null
          unified_voice_profile?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oracle_intelligence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      oracle_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          organization_id: string
          progress: number | null
          result: Json | null
          started_at: string | null
          status: string
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          organization_id: string
          progress?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          organization_id?: string
          progress?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oracle_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      oracle_knowledge_base: {
        Row: {
          category: string | null
          content: string
          content_type: string
          created_at: string
          created_by: string | null
          embedding_hash: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          organization_id: string
          source_entity_id: string | null
          source_entity_type: string | null
          source_type: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          embedding_hash?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          organization_id: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_type?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          embedding_hash?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          organization_id?: string
          source_entity_id?: string | null
          source_entity_type?: string | null
          source_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "oracle_knowledge_base_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      organization_images: {
        Row: {
          category: string
          created_at: string
          file_path: string
          file_size_bytes: number | null
          id: string
          mime_type: string | null
          name: string
          organization_id: string
          public_url: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          name: string
          organization_id: string
          public_url: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          organization_id?: string
          public_url?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          backup_schedule: Json | null
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
          backup_schedule?: Json | null
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
          backup_schedule?: Json | null
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
      page_hero_settings: {
        Row: {
          created_at: string
          hero_effect: string
          hero_effect_brightness: number
          hero_effect_color_scheme: string
          hero_effect_density: string
          hero_effect_intensity: string
          hero_effect_mode: string
          hero_effect_speed: string
          id: string
          page_slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          hero_effect?: string
          hero_effect_brightness?: number
          hero_effect_color_scheme?: string
          hero_effect_density?: string
          hero_effect_intensity?: string
          hero_effect_mode?: string
          hero_effect_speed?: string
          id?: string
          page_slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          hero_effect?: string
          hero_effect_brightness?: number
          hero_effect_color_scheme?: string
          hero_effect_density?: string
          hero_effect_intensity?: string
          hero_effect_mode?: string
          hero_effect_speed?: string
          id?: string
          page_slug?: string
          updated_at?: string
          updated_by?: string | null
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
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      portfolio_coherence: {
        Row: {
          anomalies: Json | null
          anomaly_count: number | null
          audience_coherence: number | null
          created_at: string
          entity_count: number | null
          id: string
          insights: Json | null
          organization_id: string
          overall_score: number | null
          relationship_count: number | null
          strategic_coherence: number | null
          updated_at: string
          visual_coherence: number | null
          voice_coherence: number | null
        }
        Insert: {
          anomalies?: Json | null
          anomaly_count?: number | null
          audience_coherence?: number | null
          created_at?: string
          entity_count?: number | null
          id?: string
          insights?: Json | null
          organization_id: string
          overall_score?: number | null
          relationship_count?: number | null
          strategic_coherence?: number | null
          updated_at?: string
          visual_coherence?: number | null
          voice_coherence?: number | null
        }
        Update: {
          anomalies?: Json | null
          anomaly_count?: number | null
          audience_coherence?: number | null
          created_at?: string
          entity_count?: number | null
          id?: string
          insights?: Json | null
          organization_id?: string
          overall_score?: number | null
          relationship_count?: number | null
          strategic_coherence?: number | null
          updated_at?: string
          visual_coherence?: number | null
          voice_coherence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_coherence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_insights: {
        Row: {
          applicable_entity_ids: string[] | null
          applicable_entity_types: string[] | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          curb_cut_category: string | null
          description: string
          dismissed_by: string | null
          dismissed_reason: string | null
          id: string
          insight_type: string
          organization_id: string | null
          propagated_at: string | null
          propagation_status: string
          recommendations: Json | null
          severity: string
          source_entity_id: string
          source_entity_name: string
          source_entity_type: string
          source_module: string
          source_scan_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          applicable_entity_ids?: string[] | null
          applicable_entity_types?: string[] | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          curb_cut_category?: string | null
          description: string
          dismissed_by?: string | null
          dismissed_reason?: string | null
          id?: string
          insight_type?: string
          organization_id?: string | null
          propagated_at?: string | null
          propagation_status?: string
          recommendations?: Json | null
          severity?: string
          source_entity_id: string
          source_entity_name: string
          source_entity_type?: string
          source_module: string
          source_scan_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          applicable_entity_ids?: string[] | null
          applicable_entity_types?: string[] | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          curb_cut_category?: string | null
          description?: string
          dismissed_by?: string | null
          dismissed_reason?: string | null
          id?: string
          insight_type?: string
          organization_id?: string | null
          propagated_at?: string | null
          propagation_status?: string
          recommendations?: Json | null
          severity?: string
          source_entity_id?: string
          source_entity_name?: string
          source_entity_type?: string
          source_module?: string
          source_scan_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_relationships: {
        Row: {
          anomaly_score: number | null
          anomaly_type: string | null
          created_at: string
          dimensions: Json | null
          id: string
          metadata: Json | null
          organization_id: string
          rationale: string | null
          relationship_type: string
          source_entity_id: string
          source_entity_name: string
          source_entity_type: string
          strength_score: number | null
          target_entity_id: string
          target_entity_name: string
          target_entity_type: string
          updated_at: string
        }
        Insert: {
          anomaly_score?: number | null
          anomaly_type?: string | null
          created_at?: string
          dimensions?: Json | null
          id?: string
          metadata?: Json | null
          organization_id: string
          rationale?: string | null
          relationship_type?: string
          source_entity_id: string
          source_entity_name: string
          source_entity_type: string
          strength_score?: number | null
          target_entity_id: string
          target_entity_name: string
          target_entity_type: string
          updated_at?: string
        }
        Update: {
          anomaly_score?: number | null
          anomaly_type?: string | null
          created_at?: string
          dimensions?: Json | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          rationale?: string | null
          relationship_type?: string
          source_entity_id?: string
          source_entity_name?: string
          source_entity_type?: string
          strength_score?: number | null
          target_entity_id?: string
          target_entity_name?: string
          target_entity_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_templates: {
        Row: {
          card_image_url: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entity_id: string
          entity_type: string
          external_url: string | null
          file_name: string
          file_size: string | null
          file_type: string | null
          file_url: string
          id: string
          is_embedded_folder: boolean | null
          name: string
          organization_id: string | null
          slides: Json
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          card_image_url?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id: string
          entity_type?: string
          external_url?: string | null
          file_name: string
          file_size?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          is_embedded_folder?: boolean | null
          name: string
          organization_id?: string | null
          slides?: Json
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          card_image_url?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          external_url?: string | null
          file_name?: string
          file_size?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_embedded_folder?: boolean | null
          name?: string
          organization_id?: string | null
          slides?: Json
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      qr_codes: {
        Row: {
          bg_color: string
          corner_style: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dot_style: string | null
          entity_id: string
          entity_type: string
          error_correction: string
          fg_color: string
          id: string
          is_active: boolean
          logo_type: string | null
          logo_url: string | null
          name: string
          organization_id: string | null
          scan_count: number
          size: number
          updated_at: string
          url: string
          use_case: string | null
        }
        Insert: {
          bg_color?: string
          corner_style?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dot_style?: string | null
          entity_id: string
          entity_type?: string
          error_correction?: string
          fg_color?: string
          id?: string
          is_active?: boolean
          logo_type?: string | null
          logo_url?: string | null
          name: string
          organization_id?: string | null
          scan_count?: number
          size?: number
          updated_at?: string
          url: string
          use_case?: string | null
        }
        Update: {
          bg_color?: string
          corner_style?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dot_style?: string | null
          entity_id?: string
          entity_type?: string
          error_correction?: string
          fg_color?: string
          id?: string
          is_active?: boolean
          logo_type?: string | null
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          scan_count?: number
          size?: number
          updated_at?: string
          url?: string
          use_case?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_actions: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string
          recommendation_key: string
          recommendation_text: string
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          recommendation_key: string
          recommendation_text: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          recommendation_key?: string
          recommendation_text?: string
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      research_briefings: {
        Row: {
          actioned_at: string | null
          briefing_type: string
          competitive_insights: Json | null
          confidence_score: number | null
          created_at: string
          created_by: string | null
          cross_entity_insights: Json | null
          entity_id: string
          entity_type: string
          expires_at: string | null
          growth_opportunities: Json | null
          id: string
          knowledge_extracted: boolean
          market_intelligence: Json | null
          organization_id: string | null
          priority_actions: Json | null
          read_at: string | null
          risk_alerts: Json | null
          sentiment_signals: Json | null
          status: string | null
          strategic_recommendations: Json | null
          suggested_updates: Json | null
          summary: string | null
          title: string
          trend_analysis: Json | null
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          actioned_at?: string | null
          briefing_type?: string
          competitive_insights?: Json | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          cross_entity_insights?: Json | null
          entity_id: string
          entity_type?: string
          expires_at?: string | null
          growth_opportunities?: Json | null
          id?: string
          knowledge_extracted?: boolean
          market_intelligence?: Json | null
          organization_id?: string | null
          priority_actions?: Json | null
          read_at?: string | null
          risk_alerts?: Json | null
          sentiment_signals?: Json | null
          status?: string | null
          strategic_recommendations?: Json | null
          suggested_updates?: Json | null
          summary?: string | null
          title: string
          trend_analysis?: Json | null
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          actioned_at?: string | null
          briefing_type?: string
          competitive_insights?: Json | null
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          cross_entity_insights?: Json | null
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          growth_opportunities?: Json | null
          id?: string
          knowledge_extracted?: boolean
          market_intelligence?: Json | null
          organization_id?: string | null
          priority_actions?: Json | null
          read_at?: string | null
          risk_alerts?: Json | null
          sentiment_signals?: Json | null
          status?: string | null
          strategic_recommendations?: Json | null
          suggested_updates?: Json | null
          summary?: string | null
          title?: string
          trend_analysis?: Json | null
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_briefings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      research_external_sources: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean
          last_fetched_at: string | null
          organization_id: string | null
          source_type: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type?: string
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          organization_id?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          organization_id?: string | null
          source_type?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_external_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      research_schedules: {
        Row: {
          briefing_type: string
          cadence: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          briefing_type?: string
          cadence?: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          briefing_type?: string
          cadence?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      skill_export_history: {
        Row: {
          approx_tokens: number | null
          brand_name: string
          changelog: string | null
          created_at: string
          diff_summary: Json | null
          entity_id: string
          entity_type: string
          exported_to: string[] | null
          file_count: number | null
          id: string
          locales: string[] | null
          organization_id: string | null
          prev_version: string | null
          skill_meta: Json | null
          user_id: string | null
          version: string
        }
        Insert: {
          approx_tokens?: number | null
          brand_name: string
          changelog?: string | null
          created_at?: string
          diff_summary?: Json | null
          entity_id: string
          entity_type: string
          exported_to?: string[] | null
          file_count?: number | null
          id?: string
          locales?: string[] | null
          organization_id?: string | null
          prev_version?: string | null
          skill_meta?: Json | null
          user_id?: string | null
          version: string
        }
        Update: {
          approx_tokens?: number | null
          brand_name?: string
          changelog?: string | null
          created_at?: string
          diff_summary?: Json | null
          entity_id?: string
          entity_type?: string
          exported_to?: string[] | null
          file_count?: number | null
          id?: string
          locales?: string[] | null
          organization_id?: string | null
          prev_version?: string | null
          skill_meta?: Json | null
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      skill_qa_jobs: {
        Row: {
          brand_name: string
          completed_at: string | null
          created_at: string
          entity_id: string
          entity_type: string
          error: string | null
          id: string
          include_visual_regression: boolean
          organization_id: string | null
          partial_results: Json | null
          progress: Json
          sections: string[]
          started_at: string | null
          status: string
          tiers: string[]
          user_id: string | null
        }
        Insert: {
          brand_name: string
          completed_at?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          error?: string | null
          id?: string
          include_visual_regression?: boolean
          organization_id?: string | null
          partial_results?: Json | null
          progress?: Json
          sections?: string[]
          started_at?: string | null
          status?: string
          tiers?: string[]
          user_id?: string | null
        }
        Update: {
          brand_name?: string
          completed_at?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          error?: string | null
          id?: string
          include_visual_regression?: boolean
          organization_id?: string | null
          partial_results?: Json | null
          progress?: Json
          sections?: string[]
          started_at?: string | null
          status?: string
          tiers?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      skill_qa_reports: {
        Row: {
          avg_score_by_tier: Json
          brand_name: string
          consistently_missing: string[]
          created_at: string
          entity_id: string
          entity_type: string
          full_report: Json
          id: string
          job_id: string | null
          organization_id: string | null
          pdf_vision: Json | null
          recurring_misuses: Json
          visual_regression: Json | null
        }
        Insert: {
          avg_score_by_tier?: Json
          brand_name: string
          consistently_missing?: string[]
          created_at?: string
          entity_id: string
          entity_type: string
          full_report: Json
          id?: string
          job_id?: string | null
          organization_id?: string | null
          pdf_vision?: Json | null
          recurring_misuses?: Json
          visual_regression?: Json | null
        }
        Update: {
          avg_score_by_tier?: Json
          brand_name?: string
          consistently_missing?: string[]
          created_at?: string
          entity_id?: string
          entity_type?: string
          full_report?: Json
          id?: string
          job_id?: string | null
          organization_id?: string | null
          pdf_vision?: Json | null
          recurring_misuses?: Json
          visual_regression?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_qa_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "skill_qa_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_qa_schedules: {
        Row: {
          cadence: string
          created_at: string
          created_by: string | null
          enabled: boolean
          entity_id: string
          entity_type: string
          id: string
          last_run_at: string | null
          next_run_at: string | null
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          cadence?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          entity_id: string
          entity_type: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          cadence?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          entity_id?: string
          entity_type?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_asset_analyses: {
        Row: {
          accessibility_findings: Json | null
          analyzed_at: string | null
          bias_findings: Json | null
          bias_score: number | null
          color_compliance: Json | null
          compliance_details: Json | null
          compliance_score: number | null
          content_quality_score: number | null
          created_at: string
          cultural_sensitivity: Json | null
          engagement_factors: Json | null
          entity_id: string
          entity_type: string
          error_message: string | null
          format: string
          id: string
          image_url: string
          logo_compliance: Json | null
          optimal_posting_time: string | null
          organization_id: string
          overall_score: number | null
          placement_id: string
          platform: string
          predicted_engagement_rate: number | null
          predicted_reach: string | null
          representation_analysis: Json | null
          status: string
          text_content_analysis: Json | null
          text_content_score: number | null
          typography_compliance: Json | null
          updated_at: string
        }
        Insert: {
          accessibility_findings?: Json | null
          analyzed_at?: string | null
          bias_findings?: Json | null
          bias_score?: number | null
          color_compliance?: Json | null
          compliance_details?: Json | null
          compliance_score?: number | null
          content_quality_score?: number | null
          created_at?: string
          cultural_sensitivity?: Json | null
          engagement_factors?: Json | null
          entity_id: string
          entity_type?: string
          error_message?: string | null
          format: string
          id?: string
          image_url: string
          logo_compliance?: Json | null
          optimal_posting_time?: string | null
          organization_id: string
          overall_score?: number | null
          placement_id: string
          platform: string
          predicted_engagement_rate?: number | null
          predicted_reach?: string | null
          representation_analysis?: Json | null
          status?: string
          text_content_analysis?: Json | null
          text_content_score?: number | null
          typography_compliance?: Json | null
          updated_at?: string
        }
        Update: {
          accessibility_findings?: Json | null
          analyzed_at?: string | null
          bias_findings?: Json | null
          bias_score?: number | null
          color_compliance?: Json | null
          compliance_details?: Json | null
          compliance_score?: number | null
          content_quality_score?: number | null
          created_at?: string
          cultural_sensitivity?: Json | null
          engagement_factors?: Json | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          format?: string
          id?: string
          image_url?: string
          logo_compliance?: Json | null
          optimal_posting_time?: string | null
          organization_id?: string
          overall_score?: number | null
          placement_id?: string
          platform?: string
          predicted_engagement_rate?: number | null
          predicted_reach?: string | null
          representation_analysis?: Json | null
          status?: string
          text_content_analysis?: Json | null
          text_content_score?: number | null
          typography_compliance?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_asset_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_asset_analyses_placement_id_fkey"
            columns: ["placement_id"]
            isOneToOne: false
            referencedRelation: "social_asset_placements"
            referencedColumns: ["id"]
          },
        ]
      }
      social_asset_placements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          aspect_ratio: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          format: string
          id: string
          image_url: string | null
          notes: string | null
          organization_id: string
          platform: string
          size_height: number
          size_name: string
          size_width: number
          status: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          aspect_ratio: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type?: string
          format?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          organization_id: string
          platform: string
          size_height: number
          size_name: string
          size_width: number
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          aspect_ratio?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          format?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          organization_id?: string
          platform?: string
          size_height?: number
          size_name?: string
          size_width?: number
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_asset_placements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_metrics_snapshots: {
        Row: {
          avg_comments_per_post: number | null
          avg_likes_per_post: number | null
          avg_shares_per_post: number | null
          brand_mentions_count: number | null
          created_at: string
          created_by: string | null
          data_source: string | null
          earned_media_value: number | null
          engagement_rate: number | null
          entity_id: string
          entity_type: string
          follower_growth_percent: number | null
          followers_count: number | null
          id: string
          impressions_count: number | null
          negative_mentions: number | null
          neutral_mentions: number | null
          notes: string | null
          organic_reach_count: number | null
          organization_id: string | null
          period_type: string | null
          platform: string
          positive_mentions: number | null
          posts_count: number | null
          reach_count: number | null
          referral_traffic_count: number | null
          sentiment_score: number | null
          share_of_voice_percent: number | null
          snapshot_date: string
          updated_at: string
          viral_coefficient: number | null
        }
        Insert: {
          avg_comments_per_post?: number | null
          avg_likes_per_post?: number | null
          avg_shares_per_post?: number | null
          brand_mentions_count?: number | null
          created_at?: string
          created_by?: string | null
          data_source?: string | null
          earned_media_value?: number | null
          engagement_rate?: number | null
          entity_id: string
          entity_type: string
          follower_growth_percent?: number | null
          followers_count?: number | null
          id?: string
          impressions_count?: number | null
          negative_mentions?: number | null
          neutral_mentions?: number | null
          notes?: string | null
          organic_reach_count?: number | null
          organization_id?: string | null
          period_type?: string | null
          platform: string
          positive_mentions?: number | null
          posts_count?: number | null
          reach_count?: number | null
          referral_traffic_count?: number | null
          sentiment_score?: number | null
          share_of_voice_percent?: number | null
          snapshot_date?: string
          updated_at?: string
          viral_coefficient?: number | null
        }
        Update: {
          avg_comments_per_post?: number | null
          avg_likes_per_post?: number | null
          avg_shares_per_post?: number | null
          brand_mentions_count?: number | null
          created_at?: string
          created_by?: string | null
          data_source?: string | null
          earned_media_value?: number | null
          engagement_rate?: number | null
          entity_id?: string
          entity_type?: string
          follower_growth_percent?: number | null
          followers_count?: number | null
          id?: string
          impressions_count?: number | null
          negative_mentions?: number | null
          neutral_mentions?: number | null
          notes?: string | null
          organic_reach_count?: number | null
          organization_id?: string | null
          period_type?: string | null
          platform?: string
          positive_mentions?: number | null
          posts_count?: number | null
          reach_count?: number | null
          referral_traffic_count?: number | null
          sentiment_score?: number | null
          share_of_voice_percent?: number | null
          snapshot_date?: string
          updated_at?: string
          viral_coefficient?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_metrics_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_platform_credentials: {
        Row: {
          account_id: string | null
          account_name: string | null
          created_at: string
          created_by: string | null
          credential_type: string
          credentials: Json
          id: string
          is_active: boolean
          last_sync_at: string | null
          organization_id: string | null
          platform: string
          sync_error: string | null
          sync_frequency: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          created_by?: string | null
          credential_type?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          organization_id?: string | null
          platform: string
          sync_error?: string | null
          sync_frequency?: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          created_at?: string
          created_by?: string | null
          credential_type?: string
          credentials?: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          organization_id?: string | null
          platform?: string
          sync_error?: string | null
          sync_frequency?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_platform_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_sync_history: {
        Row: {
          completed_at: string | null
          credential_id: string | null
          data_source: string
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          metrics_fetched: Json | null
          platform: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          credential_id?: string | null
          data_source?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          metrics_fetched?: Json | null
          platform: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          credential_id?: string | null
          data_source?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          metrics_fetched?: Json | null
          platform?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_sync_history_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "social_platform_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      universe_backups: {
        Row: {
          backup_data: Json
          backup_name: string
          backup_type: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          organization_id: string | null
          product_id: string | null
          universe_name: string
          universe_type: string
          updated_at: string
        }
        Insert: {
          backup_data?: Json
          backup_name: string
          backup_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          organization_id?: string | null
          product_id?: string | null
          universe_name: string
          universe_type: string
          updated_at?: string
        }
        Update: {
          backup_data?: Json
          backup_name?: string
          backup_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          organization_id?: string | null
          product_id?: string | null
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
          {
            foreignKeyName: "universe_backups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_assistant_profiles: {
        Row: {
          communication_style: Json | null
          created_at: string
          expertise_level: string | null
          feedback_patterns: Json | null
          id: string
          interaction_count: number | null
          last_persona_update: string | null
          organization_id: string | null
          preferences: Json | null
          topics_of_interest: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          communication_style?: Json | null
          created_at?: string
          expertise_level?: string | null
          feedback_patterns?: Json | null
          id?: string
          interaction_count?: number | null
          last_persona_update?: string | null
          organization_id?: string | null
          preferences?: Json | null
          topics_of_interest?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          communication_style?: Json | null
          created_at?: string
          expertise_level?: string | null
          feedback_patterns?: Json | null
          id?: string
          interaction_count?: number | null
          last_persona_update?: string | null
          organization_id?: string | null
          preferences?: Json | null
          topics_of_interest?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_assistant_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locale_preferences: {
        Row: {
          created_at: string | null
          id: string
          preferred_country: string | null
          preferred_language: string | null
          preferred_region: string | null
          show_regional_comparison: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preferred_country?: string | null
          preferred_language?: string | null
          preferred_region?: string | null
          show_regional_comparison?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preferred_country?: string | null
          preferred_language?: string | null
          preferred_region?: string | null
          show_regional_comparison?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_logo_favorites: {
        Row: {
          created_at: string
          entity_id: string
          entity_name: string | null
          entity_slug: string | null
          entity_type: string
          id: string
          logo_id: string
          logo_name: string | null
          logo_url: string | null
          logo_variant: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_name?: string | null
          entity_slug?: string | null
          entity_type: string
          id?: string
          logo_id: string
          logo_name?: string | null
          logo_url?: string | null
          logo_variant?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_name?: string | null
          entity_slug?: string | null
          entity_type?: string
          id?: string
          logo_id?: string
          logo_name?: string | null
          logo_url?: string | null
          logo_variant?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_section_favorites: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          section_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          section_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          section_id?: string
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
      website_analysis_reports: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          grade: string | null
          id: string
          organization_id: string | null
          overall_score: number | null
          report_data: Json
          summary: string | null
          updated_at: string
          website_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_name?: string | null
          entity_type?: string
          grade?: string | null
          id?: string
          organization_id?: string | null
          overall_score?: number | null
          report_data?: Json
          summary?: string | null
          updated_at?: string
          website_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          grade?: string | null
          id?: string
          organization_id?: string | null
          overall_score?: number | null
          report_data?: Json
          summary?: string | null
          updated_at?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_analysis_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          new_value: Json | null
          old_value: Json | null
          organization_id: string | null
          outcome: string | null
          user_email: string | null
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
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          outcome?: string | null
          user_email?: string | null
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
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string | null
          outcome?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_delete_user: { Args: { target_user_id: string }; Returns: boolean }
      can_use_ai_features: {
        Args: { _entity_id?: string; _entity_type?: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_invites: { Args: never; Returns: number }
      cleanup_old_audit_logs: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
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
      get_aggregated_social_metrics: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: {
          avg_engagement_rate: number
          avg_growth_rate: number
          avg_sentiment: number
          latest_snapshot_date: string
          platforms_count: number
          top_platform: string
          total_followers: number
          total_mentions: number
        }[]
      }
      get_auth_email: { Args: never; Returns: string }
      get_brand_audit_summary: {
        Args: { p_brand_id: string; p_entity_type?: string }
        Returns: Json
      }
      get_entity_text_context: {
        Args: { p_id: string; p_table: string }
        Returns: Json
      }
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
      get_guide_card_data: {
        Args: { p_exclude_id?: string; p_table_name: string }
        Returns: {
          colors_data: Json
          hero_data: Json
          id: string
          name: string
          slug: string
        }[]
      }
      get_health_trends: {
        Args: { p_entity_id: string; p_entity_type?: string; p_months?: number }
        Returns: {
          bias_inclusion_score: number
          brand_health_score: number
          competitive_score: number
          compliance_score: number
          period_type: string
          score_deltas: Json
          snapshot_date: string
          triggered_by: string
          website_score: number
        }[]
      }
      get_intelligence_cadence: { Args: never; Returns: string }
      get_linked_products_card_data: {
        Args: { p_parent_brand_id: string }
        Returns: {
          colors_data: Json
          hero_data: Json
          id: string
          name: string
          slug: string
        }[]
      }
      get_org_health_summary: {
        Args: { p_months?: number; p_org_id: string }
        Returns: {
          avg_bias_score: number
          avg_compliance_score: number
          avg_health_score: number
          avg_website_score: number
          entity_count: number
          snapshot_date: string
        }[]
      }
      get_org_slug_by_id: {
        Args: { p_org_id: string }
        Returns: {
          name: string
          slug: string
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
      get_public_org_for_portal: {
        Args: { p_org_id?: string; p_slug?: string }
        Returns: {
          accent_color: string
          favicon_url: string
          hide_platform_branding: boolean
          id: string
          logo_url: string
          name: string
          primary_color: string
          secondary_color: string
          slug: string
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
      get_social_metrics_trends: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_months?: number
          p_platform?: string
        }
        Returns: {
          brand_mentions_count: number
          engagement_rate: number
          follower_growth_percent: number
          followers_count: number
          platform: string
          sentiment_score: number
          snapshot_date: string
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
      insert_audit_log:
        | {
            Args: {
              p_action_type?: string
              p_brand_id?: string
              p_details?: Json
              p_entity_name?: string
              p_entity_type?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_action_type?: string
              p_brand_id?: string
              p_browser?: string
              p_details?: Json
              p_device_type?: string
              p_entity_name?: string
              p_entity_type?: string
              p_new_value?: Json
              p_old_value?: Json
              p_organization_id?: string
              p_outcome?: string
              p_session_id?: string
              p_target_user_email?: string
              p_target_user_id?: string
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_valid_invite_token: {
        Args: { p_token: string }
        Returns: {
          invited_email: string
          invited_role: string
          is_valid: boolean
          org_name: string
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      org_has_public_brands: { Args: { _org_id: string }; Returns: boolean }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      update_guide_section: {
        Args: {
          p_data: string
          p_id: string
          p_section: string
          p_table: string
        }
        Returns: undefined
      }
      update_intelligence_cadence: {
        Args: { p_cadence: string }
        Returns: boolean
      }
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
      app_role: "admin" | "user" | "super_admin"
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
      app_role: ["admin", "user", "super_admin"],
    },
  },
} as const
