/**
 * QuickActionsPanel Component
 * Floating action panel for admin quick actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Package,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Zap,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBrands } from '@/contexts/BrandContext';
import { useEvents } from '@/contexts/EventContext';
import { useOrganization } from '@/contexts/OrganizationContext';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

interface QuickActionsPanelProps {
  className?: string;
}

export const QuickActionsPanel = ({ className }: QuickActionsPanelProps) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const { addBrand, addProduct, brands, products } = useBrands();
  const { addEvent, events } = useEvents();
  const { organization, members } = useOrganization();

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        onClick={() => setIsVisible(true)}
      >
        <Zap className="h-4 w-4 mr-1" />
        Quick Actions
      </Button>
    );
  }

  const handleCreateBrand = async () => {
    const newName = `New Brand ${brands.length + 1}`;
    const brand = await addBrand(newName);
    if (brand) {
      navigate(`/brand/${brand.slug}`);
    }
  };

  const handleCreateProduct = async () => {
    const newName = `New Product ${products.length + 1}`;
    const product = await addProduct(newName);
    if (product) {
      navigate(`/product/${product.slug}`);
    }
  };

  const handleCreateEvent = async () => {
    const newName = `New Event ${events.length + 1}`;
    const event = await addEvent(newName);
    if (event) {
      navigate(`/event/${event.slug}`);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new-brand',
      label: 'New Brand',
      icon: <FileText className="h-4 w-4" />,
      action: handleCreateBrand,
      variant: 'primary',
    },
    {
      id: 'new-product',
      label: 'New Product',
      icon: <Package className="h-4 w-4" />,
      action: handleCreateProduct,
    },
    {
      id: 'new-event',
      label: 'New Event',
      icon: <Calendar className="h-4 w-4" />,
      action: handleCreateEvent,
    },
    {
      id: 'team',
      label: 'Team',
      icon: <Users className="h-4 w-4" />,
      action: () => navigate('/org/settings'),
      badge: `${members.length}`,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => navigate('/org/settings'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      action: () => navigate('/org/settings'),
    },
  ];

  const stats = [
    { label: 'Brands', value: brands.length, color: 'text-primary' },
    { label: 'Products', value: products.length, color: 'text-purple-500' },
    { label: 'Events', value: events.length, color: 'text-amber-500' },
  ];

  return (
    <Card
      className={cn(
        'fixed bottom-4 right-4 z-50 w-64 shadow-xl border-border/50 backdrop-blur-sm',
        className
      )}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Quick Actions
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Stats Row */}
          <div className="flex justify-between text-xs">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={cn('text-lg font-bold', stat.color)}>{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant === 'primary' ? 'default' : 'outline'}
                size="sm"
                className="h-auto py-2 px-2 flex flex-col items-center gap-1 relative"
                onClick={action.action}
              >
                {action.icon}
                <span className="text-[10px] leading-tight">{action.label}</span>
                {action.badge && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                  >
                    {action.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Keyboard Shortcut Hint */}
          <p className="text-[10px] text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-[9px]">Shift+?</kbd> for shortcuts
          </p>
        </CardContent>
      )}
    </Card>
  );
};
