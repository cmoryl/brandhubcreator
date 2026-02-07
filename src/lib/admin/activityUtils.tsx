/**
 * Activity Log Utilities
 * Shared utility functions for activity logs across admin components
 */

import React from 'react';
import { 
  Users, Building2, Palette, Activity, 
  Eye, Edit, Trash2, UserPlus, LogIn, Download, Settings, UserCheck
} from 'lucide-react';
import { ActivityLogType } from './types';

/**
 * Get the appropriate icon for an activity log entry
 */
export const getActivityIcon = (type: ActivityLogType, entityType?: string): React.ReactNode => {
  switch (type) {
    case 'create': 
      if (entityType === 'user') return <UserPlus className="h-4 w-4 text-green-500" />;
      if (entityType === 'organization') return <Building2 className="h-4 w-4 text-purple-500" />;
      return <Palette className="h-4 w-4 text-blue-500" />;
    case 'update': 
      return <Edit className="h-4 w-4 text-amber-500" />;
    case 'delete': 
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case 'view': 
      return <Eye className="h-4 w-4 text-gray-500" />;
    case 'publish': 
      return <Eye className="h-4 w-4 text-green-500" />;
    case 'unpublish': 
      return <Eye className="h-4 w-4 text-orange-500" />;
    case 'export': 
      return <Download className="h-4 w-4 text-blue-500" />;
    case 'login': 
      return <LogIn className="h-4 w-4 text-gray-500" />;
    case 'logout': 
      return <LogIn className="h-4 w-4 text-gray-400" />;
    case 'invite': 
      return <UserPlus className="h-4 w-4 text-purple-500" />;
    case 'join': 
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case 'approve':
      return <UserCheck className="h-4 w-4 text-green-500" />;
    case 'reject':
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case 'role_change':
      return <Users className="h-4 w-4 text-purple-500" />;
    case 'settings_change':
      return <Settings className="h-4 w-4 text-blue-500" />;
    case 'member_remove':
      return <UserPlus className="h-4 w-4 text-red-500" />;
    case 'backup':
      return <Download className="h-4 w-4 text-blue-500" />;
    case 'restore':
      return <Download className="h-4 w-4 text-green-500" />;
    default: 
      return <Activity className="h-4 w-4" />;
  }
};

/**
 * Get human-readable description for action types
 */
export const getActionDescription = (actionType: string): string => {
  const descriptions: Record<string, string> = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    view: 'viewed',
    publish: 'published',
    unpublish: 'unpublished',
    export: 'exported',
    login: 'logged in',
    logout: 'logged out',
    invite: 'invited member to',
    join: 'joined',
    approve: 'approved',
    reject: 'rejected',
    role_change: 'changed role for',
    settings_change: 'changed settings',
    member_remove: 'removed member from',
    backup: 'created backup for',
    restore: 'restored backup for',
  };
  return descriptions[actionType] || actionType;
};

/**
 * Format a timestamp for display
 */
export const formatActivityTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};
