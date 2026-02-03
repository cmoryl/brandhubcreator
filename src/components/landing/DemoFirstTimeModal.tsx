import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, X } from 'lucide-react';

const STORAGE_KEY = 'brandhub_demo_prompt_shown';

interface DemoFirstTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPath: string;
  demoName: string;
}

export function DemoFirstTimeModal({
  open,
  onOpenChange,
  targetPath,
  demoName,
}: DemoFirstTimeModalProps) {
  const navigate = useNavigate();

  const handleContinueToDemo = () => {
    // Mark as shown so it doesn't appear again
    localStorage.setItem(STORAGE_KEY, 'true');
    onOpenChange(false);
    // Navigate with query param to trigger scroll to first section
    navigate(`${targetPath}?start=true`);
  };

  const handleSkip = () => {
    // Mark as shown and close without navigating
    localStorage.setItem(STORAGE_KEY, 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <DialogTitle className="text-xl">Explore a Live Demo First?</DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2">
            See how <span className="font-semibold text-foreground">{demoName}</span> showcases 
            brand guidelines in action. Get inspired before creating your own!
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 my-4 border border-border/50">
          <h4 className="font-medium text-sm mb-2">What you'll see:</h4>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Complete brand identity system
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Interactive color palettes & typography
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Logo variations & usage guidelines
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Patterns, gradients & design elements
            </li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Maybe Later
          </Button>
          <Button onClick={handleContinueToDemo} className="gap-2">
            Explore Demo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to check if this is the first time
export function useFirstTimeDemoPrompt() {
  const [hasSeenPrompt, setHasSeenPrompt] = useState<boolean | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY) === 'true';
    setHasSeenPrompt(seen);
  }, []);

  const shouldShowPrompt = hasSeenPrompt === false;

  return { shouldShowPrompt, hasSeenPrompt };
}
