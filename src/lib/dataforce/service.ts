/**
 * DataForce Service Layer
 * Unified API for all DataForce integrations
 */

import { supabase } from '@/integrations/supabase/client';

export interface DataForceServiceConfig {
  organizationId: string;
}

export interface ComplianceCheckParams {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  guideData: Record<string, unknown>;
}

export interface ValidationParams {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  variantId?: string;
  targetRegions: string[];
  panelSize: number;
  contentSnapshot: Record<string, unknown>;
}

export interface TrainingParams {
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  trainingType: 'voice' | 'visual' | 'content';
  trainingConfig?: {
    baseModel?: string;
    learningRate?: number;
    epochs?: number;
    customPrompts?: string[];
  };
}

export interface ContentGenerationParams {
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  prompt: string;
  contentType: 'tagline' | 'description' | 'social_post' | 'email' | 'blog';
}

export interface AssistantMessageParams {
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  message: string;
  conversationId?: string;
  languageCode?: string;
}

/**
 * DataForce Service
 * Provides a unified interface for all DataForce AI capabilities
 */
export class DataForceService {
  private organizationId: string;

  constructor(config: DataForceServiceConfig) {
    this.organizationId = config.organizationId;
  }

  /**
   * Run a brand compliance check
   */
  async runComplianceCheck(params: ComplianceCheckParams) {
    const response = await supabase.functions.invoke('dataforce-compliance', {
      body: {
        organization_id: this.organizationId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        guide_data: params.guideData,
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  }

  /**
   * Submit content for cultural validation
   */
  async submitValidation(params: ValidationParams) {
    const response = await supabase.functions.invoke('dataforce-validation', {
      body: {
        organization_id: this.organizationId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_name: params.entityName,
        variant_id: params.variantId,
        target_regions: params.targetRegions,
        panel_size: params.panelSize,
        content_snapshot: params.contentSnapshot,
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  }

  /**
   * Start a GenAI training job
   */
  async startTraining(params: TrainingParams) {
    const response = await supabase.functions.invoke('dataforce-training', {
      body: {
        organization_id: this.organizationId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        training_type: params.trainingType,
        training_config: params.trainingConfig,
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  }

  /**
   * Generate branded content using trained models
   */
  async generateContent(params: ContentGenerationParams) {
    const response = await supabase.functions.invoke('dataforce-training?action=generate', {
      body: {
        organization_id: this.organizationId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        prompt: params.prompt,
        content_type: params.contentType,
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  }

  /**
   * Send a message to the brand assistant
   */
  async sendAssistantMessage(params: AssistantMessageParams) {
    const response = await supabase.functions.invoke('dataforce-assistant', {
      body: {
        organization_id: this.organizationId,
        entity_type: params.entityType,
        entity_id: params.entityId,
        message: params.message,
        conversation_id: params.conversationId,
        language_code: params.languageCode || 'en_US',
      }
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.data;
  }

  /**
   * Get compliance job history
   */
  async getComplianceHistory(entityId?: string, limit = 10) {
    let query = supabase
      .from('dataforce_compliance_jobs')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get validation request history
   */
  async getValidationHistory(entityId?: string, limit = 10) {
    let query = supabase
      .from('dataforce_validation_requests')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get training job history
   */
  async getTrainingHistory(entityId?: string, limit = 10) {
    let query = supabase
      .from('dataforce_training_jobs')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get assistant conversations
   */
  async getConversations(entityId?: string, limit = 10) {
    let query = supabase
      .from('dataforce_assistant_conversations')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (entityId) {
      query = query.eq('entity_id', entityId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get DataForce configuration
   */
  async getConfig() {
    const { data, error } = await supabase
      .from('dataforce_config')
      .select('*')
      .eq('organization_id', this.organizationId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Update DataForce configuration
   */
  async updateConfig(updates: Record<string, unknown>) {
    const { data: existing } = await supabase
      .from('dataforce_config')
      .select('id')
      .eq('organization_id', this.organizationId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('dataforce_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('organization_id', this.organizationId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('dataforce_config')
        .insert({
          organization_id: this.organizationId,
          ...updates,
        });

      if (error) throw error;
    }

    return this.getConfig();
  }

  /**
   * Get aggregated metrics for dashboard
   */
  async getDashboardMetrics() {
    const [compliance, validation, training, conversations] = await Promise.all([
      this.getComplianceHistory(undefined, 50),
      this.getValidationHistory(undefined, 50),
      this.getTrainingHistory(undefined, 50),
      this.getConversations(undefined, 50),
    ]);

    const completedCompliance = compliance?.filter(j => j.status === 'completed') || [];
    const completedValidation = validation?.filter(r => r.status === 'completed') || [];
    const completedTraining = training?.filter(j => j.status === 'completed') || [];

    return {
      compliance: {
        total: compliance?.length || 0,
        completed: completedCompliance.length,
        avgScore: completedCompliance.length > 0
          ? completedCompliance.reduce((acc, j) => acc + (j.compliance_score || 0), 0) / completedCompliance.length
          : 0,
      },
      validation: {
        total: validation?.length || 0,
        completed: completedValidation.length,
        pending: validation?.filter(r => r.status === 'pending').length || 0,
        avgScore: completedValidation.length > 0
          ? completedValidation.reduce((acc, r) => acc + (r.validation_score || 0), 0) / completedValidation.length
          : 0,
      },
      training: {
        total: training?.length || 0,
        completed: completedTraining.length,
        activeModels: completedTraining.filter(j => j.model_id).length,
      },
      conversations: {
        total: conversations?.length || 0,
      },
    };
  }
}

/**
 * Create a DataForce service instance
 */
export function createDataForceService(organizationId: string): DataForceService {
  return new DataForceService({ organizationId });
}
