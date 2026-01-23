import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, ChevronsUpDown, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAdminOrganizations } from '@/hooks/useAdminOrganizations';
import { useBrands } from '@/contexts/BrandContext';
import { Organization } from '@/lib/organization/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface OrganizationSwitcherProps {
  onSwitch?: (org: Organization | null) => void;
  navigateOnSelect?: boolean;
}

export const OrganizationSwitcher = ({ onSwitch, navigateOnSelect = true }: OrganizationSwitcherProps) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { organization: currentOrg, refetch: refetchOrg } = useOrganization();
  const { organizations, isLoading } = useAdminOrganizations();
  const { refetch: refetchBrands, saveNow, hasPendingChanges } = useBrands();
  
  // Track selected org separately from context to avoid race conditions
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const switchInProgressRef = useRef(false);

  // Sync selected org with current org from context (only on initial load)
  useEffect(() => {
    if (currentOrg && !selectedOrg && !switchInProgressRef.current) {
      setSelectedOrg(currentOrg);
    }
  }, [currentOrg, selectedOrg]);

  // Only show for admins
  if (!isAdmin) return null;

  const handleSelect = useCallback(async (org: Organization | null) => {
    // Prevent concurrent switches
    if (isSwitching || switchInProgressRef.current) return;
    
    // Don't switch if same org selected
    if (org?.id === selectedOrg?.id || (!org && !selectedOrg)) {
      return;
    }

    switchInProgressRef.current = true;
    setIsSwitching(true);
    
    try {
      // Save any pending changes before switching
      if (hasPendingChanges()) {
        toast.info('Saving changes before switching...');
        await saveNow();
      }

      // Update local state first for immediate UI feedback
      setSelectedOrg(org);
      onSwitch?.(org);
      
      // Navigate to the organization's portal page when selected
      if (navigateOnSelect && org) {
        // Navigate immediately, then refetch in background
        navigate(`/org/${org.slug}`);
        // Refetch data for the new org context (non-blocking)
        Promise.all([refetchBrands(), refetchOrg()]).catch(console.error);
      } else if (!org) {
        // "All Organizations" view - go to admin dashboard or home
        navigate('/');
        refetchBrands().catch(console.error);
      }
    } catch (err) {
      console.error('Error switching organization:', err);
      toast.error('Failed to switch organization');
      // Revert selection on error
      setSelectedOrg(currentOrg);
    } finally {
      setIsSwitching(false);
      // Small delay before allowing another switch
      setTimeout(() => {
        switchInProgressRef.current = false;
      }, 500);
    }
  }, [isSwitching, selectedOrg, currentOrg, hasPendingChanges, saveNow, onSwitch, navigateOnSelect, refetchBrands, refetchOrg, navigate]);

  const displayOrg = selectedOrg || currentOrg;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full gap-2 justify-between"
          disabled={isLoading || isSwitching}
        >
          <div className="flex items-center gap-2 truncate">
            {isSwitching ? (
              <RefreshCw className="h-4 w-4 shrink-0 text-muted-foreground animate-spin" />
            ) : (
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate text-sm">
              {displayOrg ? displayOrg.name : 'All Organizations'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {displayOrg === null && (
              <Badge variant="secondary" className="text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px] bg-popover z-50">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Organization
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* View All option for admins */}
        <DropdownMenuItem 
          onClick={() => handleSelect(null)}
          className="gap-2"
          disabled={isSwitching}
        >
          <Eye className="h-4 w-4" />
          <div className="flex-1">
            <span className="font-medium">All Organizations</span>
            <p className="text-xs text-muted-foreground">View brands across all orgs</p>
          </div>
          {selectedOrg === null && (
            <Check className="h-4 w-4 text-accent" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">Loading organizations...</span>
          </DropdownMenuItem>
        ) : organizations.length === 0 ? (
          <DropdownMenuItem disabled>
            <span className="text-muted-foreground">No organizations found</span>
          </DropdownMenuItem>
        ) : (
          organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSelect(org)}
              disabled={isSwitching}
              className={cn(
                "gap-2",
                selectedOrg?.id === org.id && "bg-accent/10"
              )}
            >
              {org.logoUrl ? (
                <img 
                  src={org.logoUrl} 
                  alt={org.name} 
                  className="h-5 w-5 rounded object-cover"
                />
              ) : (
                <div 
                  className="h-5 w-5 rounded flex items-center justify-center text-xs font-medium"
                  style={{ 
                    backgroundColor: org.primaryColor || '#6366f1',
                    color: 'white'
                  }}
                >
                  {org.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 truncate">
                <span className="font-medium">{org.name}</span>
                <p className="text-xs text-muted-foreground truncate">/{org.slug}</p>
              </div>
              {selectedOrg?.id === org.id && (
                <Check className="h-4 w-4 text-accent shrink-0" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
