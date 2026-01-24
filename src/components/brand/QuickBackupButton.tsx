import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useBrandBackup } from '@/hooks/useBrandBackup';
import { BrandGuide, ProductGuide } from '@/types/brand';

interface QuickBackupButtonProps {
  guide: BrandGuide | ProductGuide;
}

export const QuickBackupButton = ({ guide }: QuickBackupButtonProps) => {
  const { downloadGuide } = useBrandBackup();

  const handleQuickBackup = () => {
    downloadGuide(guide);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleQuickBackup}
          className="h-9 w-9"
          aria-label={`Quick backup ${guide.hero.name}`}
        >
          <Download className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Quick Backup</TooltipContent>
    </Tooltip>
  );
};
