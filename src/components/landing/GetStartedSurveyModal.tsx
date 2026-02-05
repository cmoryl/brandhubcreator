/**
 * GetStartedSurveyModal - Choose Your Adventure style onboarding
 * Multi-step wizard with visual card selections
 */

 import React, { useState, forwardRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, ArrowRight, ArrowLeft, Sparkles, Heart, 
  Building2, Rocket, Users, Palette, Calendar, Package,
  User, Briefcase, Globe, Zap, Check
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'We need your name').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  company: z.string().trim().max(100).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

 interface GetStartedSurveyModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
 }
 
 // Wrap component with forwardRef to prevent ref warnings when used with parent components

// Adventure paths
const GOALS = [
  { 
    id: 'brand-guidelines', 
    icon: Palette, 
    label: 'Brand Guidelines',
    description: 'Create living brand documentation',
    color: 'from-violet-500 to-purple-600'
  },
  { 
    id: 'product-branding', 
    icon: Package, 
    label: 'Product Branding',
    description: 'Build product identity systems',
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'event-branding', 
    icon: Calendar, 
    label: 'Event Kits',
    description: 'Conference & event materials',
    color: 'from-sky-500 to-cyan-500'
  },
  { 
    id: 'agency', 
    icon: Globe, 
    label: 'Agency / Multi-brand',
    description: 'Manage multiple client brands',
    color: 'from-emerald-500 to-teal-500'
  },
];

const TEAM_SIZES = [
  { id: 'solo', icon: User, label: 'Just me', description: 'Solo creator' },
  { id: 'small', icon: Users, label: '2-10', description: 'Small team' },
  { id: 'medium', icon: Building2, label: '11-50', description: 'Growing company' },
  { id: 'large', icon: Briefcase, label: '50+', description: 'Enterprise' },
];

const URGENCY = [
  { id: 'exploring', icon: Sparkles, label: "Just exploring", emoji: '🔍' },
  { id: 'planning', icon: Rocket, label: "Planning a project", emoji: '📋' },
  { id: 'ready', icon: Zap, label: "Ready to start!", emoji: '🚀' },
];

export function GetStartedSurveyModal({ open, onOpenChange }: GetStartedSurveyModalProps) {
  const [step, setStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedTeamSize, setSelectedTeamSize] = useState<string | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', company: '' },
  });

  const resetAll = () => {
    setStep(0);
    setSelectedGoal(null);
    setSelectedTeamSize(null);
    setSelectedUrgency(null);
    setIsSuccess(false);
    form.reset();
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetAll();
    onOpenChange(isOpen);
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const canProceed = () => {
    if (step === 0) return !!selectedGoal;
    if (step === 1) return !!selectedTeamSize;
    if (step === 2) return !!selectedUrgency;
    return true;
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('lead_submissions').insert({
        name: data.name,
        email: data.email,
        company: data.company || null,
        use_case: selectedGoal,
        team_size: selectedTeamSize,
        message: `Urgency: ${selectedUrgency}`,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Adventure started! 🎉');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-0 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 px-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6"
            >
              <Heart className="h-10 w-10 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-3">You're In! 🎉</h3>
            <p className="text-muted-foreground max-w-xs mb-6">
              Your brand adventure is about to begin. A real human will reach out within 24 hours.
            </p>
            <Button onClick={() => handleClose(false)} variant="outline">
              Close
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg border-0 p-0 overflow-hidden gap-0">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: '0%' }}
            animate={{ width: `${((step + 1) / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 0: What's your goal? */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">Step 1 of 4</span>
                  <h2 className="text-xl font-bold mt-2">What brings you here? ✨</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose your brand adventure</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map((goal) => {
                    const Icon = goal.icon;
                    const isSelected = selectedGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        onClick={() => setSelectedGoal(goal.id)}
                        className={cn(
                          "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected 
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                            : "border-border bg-card"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-3",
                          goal.color
                        )}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="font-medium text-sm">{goal.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{goal.description}</div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 1: Team size */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">Step 2 of 4</span>
                  <h2 className="text-xl font-bold mt-2">How big is your team? 👥</h2>
                  <p className="text-sm text-muted-foreground mt-1">This helps us tailor your experience</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {TEAM_SIZES.map((size) => {
                    const Icon = size.icon;
                    const isSelected = selectedTeamSize === size.id;
                    return (
                      <button
                        key={size.id}
                        onClick={() => setSelectedTeamSize(size.id)}
                        className={cn(
                          "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected 
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                            : "border-border bg-card"
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <Icon className="h-6 w-6 text-primary mb-2" />
                        <div className="font-semibold">{size.label}</div>
                        <div className="text-xs text-muted-foreground">{size.description}</div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Urgency / Timeline */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">Step 3 of 4</span>
                  <h2 className="text-xl font-bold mt-2">Where are you at? 🎯</h2>
                  <p className="text-sm text-muted-foreground mt-1">No wrong answers here</p>
                </div>

                <div className="space-y-3">
                  {URGENCY.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedUrgency === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => setSelectedUrgency(option.id)}
                        className={cn(
                          "w-full relative p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected 
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                            : "border-border bg-card"
                        )}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: Contact info */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">Final Step</span>
                  <h2 className="text-xl font-bold mt-2">Let's stay in touch! 💙</h2>
                  <p className="text-sm text-muted-foreground mt-1">Where should we send your invite?</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      placeholder="What should we call you?"
                      className="h-12"
                      {...form.register('name')}
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      className="h-12"
                      {...form.register('email')}
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-muted-foreground">
                      Company <span className="text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="company"
                      placeholder="Where do you work?"
                      className="h-12"
                      {...form.register('company')}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base gap-2" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Starting your adventure...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Start My Adventure
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    We'll reach out within 24 hours • No spam, pinky promise 🤙
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          {step < 3 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={step === 0}
                className={cn(step === 0 && "invisible")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={prevStep}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
