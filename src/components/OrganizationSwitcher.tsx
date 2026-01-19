import { useState } from 'react';
import { Building2, Check, ChevronsUpDown, Eye } from 'lucide-react';
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
import { Organization } from '@/types/organization';
import { cn } from '@/lib/utils';

interface OrganizationSwitcherProps {
  onSwitch?: (org: Organization | null) => void;
}

export const OrganizationSwitcher = ({ onSwitch }: OrganizationSwitcherProps) => {
  const { isAdmin } = useAuth();
  const { organization: currentOrg } = useOrganization();
  const { organizations, isLoading } = useAdminOrganizations();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(currentOrg);

  // Only show for admins
  if (!isAdmin) return null;

  const handleSelect = (org: Organization | null) => {
    setSelectedOrg(org);
    onSwitch?.(org);
  };

  const displayOrg = selectedOrg || currentOrg;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="w-full gap-2 justify-between"
          disabled={isLoading}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
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
