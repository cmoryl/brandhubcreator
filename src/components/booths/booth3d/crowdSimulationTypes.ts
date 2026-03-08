/**
 * Types for booth crowd simulation data
 */

export interface HighVisibilityZone {
  name: string;
  description: string;
  gridX: number;
  gridZ: number;
  intensity: number;
}

export interface DeadZone {
  name: string;
  description: string;
  gridX: number;
  gridZ: number;
  suggestion: string;
}

export interface EngagementZone {
  name: string;
  type: 'screen' | 'demo' | 'reception' | 'meeting' | 'product-display' | 'seating';
  estimatedDwellTime: string;
  avgCrowdSize: number;
  gridX: number;
  gridZ: number;
}

export interface Sightline {
  from: string;
  visibleElements: string[];
  blockedElements: string[];
  score: number;
}

export interface QueuePrediction {
  location: string;
  peakWaitTime: string;
  avgQueueLength: number;
  bottleneckRisk: 'low' | 'medium' | 'high';
}

export interface Optimization {
  priority: 'high' | 'medium' | 'low';
  category: 'tv-placement' | 'demo-station' | 'product-shelf' | 'reception' | 'seating' | 'signage' | 'traffic-flow';
  recommendation: string;
  impact: string;
}

export interface CrowdSimulationData {
  visibilityScore: number;
  summary: string;
  heatMapGrid: number[][];
  highVisibilityZones: HighVisibilityZone[];
  deadZones: DeadZone[];
  engagementZones: EngagementZone[];
  sightlines: Sightline[];
  queuePredictions: QueuePrediction[];
  overallDwellTime: string;
  peakCapacity: number;
  optimizations: Optimization[];
}
