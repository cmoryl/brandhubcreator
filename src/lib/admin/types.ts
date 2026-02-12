/**
 * Centralized Admin Types
 * Shared interfaces and types for the admin dashboard and related components
 */

import { ReactNode } from 'react';

// ============= Dashboard Stats =============

export interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalBrands: number;
  totalProducts: number;
  totalEvents: number;
  publicEvents: number;
  activeUsersToday: number;
  newUsersThisWeek: number;
  publicBrands: number;
  storageUsed: string;
  pendingApprovals: number;
}

// ============= Activity Log Types =============

export type ActivityLogType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'publish' 
  | 'unpublish' 
  | 'export' 
  | 'login' 
  | 'logout' 
  | 'invite' 
  | 'join'
  | 'approve'
  | 'reject'
  | 'role_change'
  | 'settings_change'
  | 'member_remove'
  | 'backup'
  | 'restore';

export interface ActivityLog {
  id: string;
  type: ActivityLogType;
  entityType: string;
  entityName: string;
  description: string;
  timestamp: string;
  user?: string;
  userEmail?: string;
  userId?: string;
  details?: Record<string, unknown>;
}

// ============= User Data =============

export interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: string;
  organizations: number;
  brands: number;
}

// ============= Organization Data =============

export interface OrgData {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  memberCount: number;
  brandCount: number;
  productCount: number;
  eventCount: number;
  owner: string;
}

// ============= Module Status =============

export interface ModuleStatus {
  id: string;
  name: string;
  icon: ReactNode;
  count: number;
  status: 'healthy' | 'warning' | 'error';
  trend?: number;
  description: string;
}

// ============= Quick Action =============

export interface QuickAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  badge?: number;
}
