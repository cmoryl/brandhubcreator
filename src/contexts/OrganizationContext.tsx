/**
 * Organization Context
 * Provides organization state to the React component tree
 * Uses modular hooks and services for clean separation
 * Updated: Triggers rebuild
 */

import { createContext, useContext, ReactNode } from 'react';
import { useOrganizationData, UseOrganizationDataReturn } from '@/hooks/useOrganizationData';

const OrganizationContext = createContext<UseOrganizationDataReturn | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const organizationData = useOrganizationData();

  return (
    <OrganizationContext.Provider value={organizationData}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): UseOrganizationDataReturn => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
