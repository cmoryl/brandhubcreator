/**
 * DataForce Integration Types
 * Types for Brand Compliance AI, AI Brand Assistant, Cultural Validation, and GenAI Training
 */

export * from './service';
export interface DataForceConfig {
  id: string;
  organizationId: string;
  apiKey?: string;
  apiEndpoint: string;
  apiMode: 'demo' | 'live';
  
  // Service enablement
  complianceAiEnabled: boolean;
  brandAssistantEnabled: boolean;
  culturalValidationEnabled: boolean;
  genaiTrainingEnabled: boolean;
  
  // Compliance AI settings
  complianceModelId?: string;
  complianceAutoScan: boolean;
  complianceThreshold: number;
  
  // Brand Assistant settings
  assistantModelId?: string;
  assistantLanguages: string[];
  assistantPersona?: string;
  
  // Cultural Validation settings
  validationPanelSize: number;
  validationRegions?: string[];
  validationAutoRequest: boolean;
  
  // GenAI Training settings
  trainingModelBase: string;
  trainingVoiceSamples: number;
  trainingLastSyncAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceJob {
  id: string;
  organizationId: string;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  complianceScore?: number;
  issuesFound: number;
  issuesData: ComplianceIssue[];
  assetsScanned: number;
  createdAt: string;
  completedAt?: string;
  createdBy?: string;
}

export interface ComplianceIssue {
  id: string;
  type: 'color' | 'typography' | 'logo' | 'imagery' | 'messaging' | 'layout';
  severity: 'critical' | 'warning' | 'info';
  assetName: string;
  assetUrl?: string;
  description: string;
  recommendation: string;
  confidence: number;
}

export interface ValidationRequest {
  id: string;
  organizationId: string;
  entityType: 'brand' | 'product' | 'event';
  entityId: string;
  entityName: string;
  variantId?: string;
  targetRegions: string[];
  status: 'pending' | 'in_review' | 'completed' | 'cancelled';
  panelSize: number;
  responsesReceived: number;
  validationScore?: number;
  feedbackSummary?: ValidationFeedback;
  contentSnapshot?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
  createdBy?: string;
}

export interface ValidationFeedback {
  overallRating: number;
  culturalAppropriateness: number;
  messagingClarity: number;
  visualAppeal: number;
  comments: ValidationComment[];
  recommendations: string[];
}

export interface ValidationComment {
  region: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  text: string;
  category: 'cultural' | 'language' | 'visual' | 'general';
}

export interface AssistantConversation {
  id: string;
  organizationId: string;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  userId: string;
  languageCode: string;
  messages: AssistantMessage[];
  contextData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
  };
}

export interface TrainingJob {
  id: string;
  organizationId: string;
  entityType?: 'brand' | 'product' | 'event';
  entityId?: string;
  trainingType: 'voice' | 'visual' | 'content';
  status: 'pending' | 'collecting' | 'training' | 'completed' | 'failed';
  samplesCollected: number;
  samplesTarget: number;
  modelId?: string;
  trainingConfig?: TrainingConfig;
  metrics?: TrainingMetrics;
  createdAt: string;
  completedAt?: string;
  createdBy?: string;
}

export interface TrainingConfig {
  baseModel: string;
  learningRate: number;
  epochs: number;
  batchSize: number;
  customPrompts?: string[];
}

export interface TrainingMetrics {
  accuracy: number;
  loss: number;
  validationScore: number;
  brandAlignmentScore: number;
  sampleUtilization: number;
}

// Database mappers
export function dbToDataForceConfig(db: any): DataForceConfig {
  return {
    id: db.id,
    organizationId: db.organization_id,
    apiKey: db.api_key,
    apiEndpoint: db.api_endpoint,
    apiMode: db.api_mode,
    complianceAiEnabled: db.compliance_ai_enabled,
    brandAssistantEnabled: db.brand_assistant_enabled,
    culturalValidationEnabled: db.cultural_validation_enabled,
    genaiTrainingEnabled: db.genai_training_enabled,
    complianceModelId: db.compliance_model_id,
    complianceAutoScan: db.compliance_auto_scan,
    complianceThreshold: db.compliance_threshold,
    assistantModelId: db.assistant_model_id,
    assistantLanguages: db.assistant_languages || ['en_US'],
    assistantPersona: db.assistant_persona,
    validationPanelSize: db.validation_panel_size,
    validationRegions: db.validation_regions,
    validationAutoRequest: db.validation_auto_request,
    trainingModelBase: db.training_model_base,
    trainingVoiceSamples: db.training_voice_samples,
    trainingLastSyncAt: db.training_last_sync_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function dbToComplianceJob(db: any): ComplianceJob {
  return {
    id: db.id,
    organizationId: db.organization_id,
    entityType: db.entity_type,
    entityId: db.entity_id,
    entityName: db.entity_name,
    status: db.status,
    complianceScore: db.compliance_score,
    issuesFound: db.issues_found,
    issuesData: db.issues_data || [],
    assetsScanned: db.assets_scanned,
    createdAt: db.created_at,
    completedAt: db.completed_at,
    createdBy: db.created_by,
  };
}

export function dbToValidationRequest(db: any): ValidationRequest {
  return {
    id: db.id,
    organizationId: db.organization_id,
    entityType: db.entity_type,
    entityId: db.entity_id,
    entityName: db.entity_name,
    variantId: db.variant_id,
    targetRegions: db.target_regions,
    status: db.status,
    panelSize: db.panel_size,
    responsesReceived: db.responses_received,
    validationScore: db.validation_score,
    feedbackSummary: db.feedback_summary,
    contentSnapshot: db.content_snapshot,
    createdAt: db.created_at,
    completedAt: db.completed_at,
    createdBy: db.created_by,
  };
}

export function dbToTrainingJob(db: any): TrainingJob {
  return {
    id: db.id,
    organizationId: db.organization_id,
    entityType: db.entity_type,
    entityId: db.entity_id,
    trainingType: db.training_type,
    status: db.status,
    samplesCollected: db.samples_collected,
    samplesTarget: db.samples_target,
    modelId: db.model_id,
    trainingConfig: db.training_config,
    metrics: db.metrics,
    createdAt: db.created_at,
    completedAt: db.completed_at,
    createdBy: db.created_by,
  };
}
