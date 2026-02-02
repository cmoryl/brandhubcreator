/**
 * GetStartedSurveyModal - Friendly, conversational contact form
 * Simplified lead capture with warm, relationship-focused copy
 */

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MessageCircle, CheckCircle, Sparkles, ArrowRight, Heart } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const surveySchema = z.object({
  name: z.string().trim().min(1, 'What should we call you?').max(100),
  email: z.string().trim().email('We need a valid email to reach you').max(255),
  company: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional(),
});

type SurveyFormData = z.infer<typeof surveySchema>;

interface GetStartedSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GetStartedSurveyModal({ open, onOpenChange }: GetStartedSurveyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      message: '',
    },
  });

  const onSubmit = async (data: SurveyFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('lead_submissions').insert({
        name: data.name,
        email: data.email,
        company: data.company || null,
        message: data.message || null,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Thanks! We\'ll be in touch soon 💙');
      
      setTimeout(() => {
        onOpenChange(false);
        setIsSuccess(false);
        form.reset();
      }, 2500);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 animate-pulse">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">You're Awesome! 🎉</h3>
            <p className="text-muted-foreground max-w-xs">
              We're excited to connect with you. Check your inbox soon — a real human will reach out!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 px-6 pt-8 pb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Let's Start a Conversation</h2>
          <p className="text-sm text-muted-foreground">
            No pressure, no sales pitch — just a friendly chat about your brand needs.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 pt-4 space-y-4">
          {/* Name - Single prominent field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              What's your name? <span className="text-primary">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Sarah"
              className="h-11"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Best email to reach you <span className="text-primary">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              className="h-11"
              {...form.register('email')}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Company - Optional with friendly label */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-muted-foreground">
              Company or brand <span className="text-xs">(optional)</span>
            </Label>
            <Input
              id="company"
              placeholder="Where do you work?"
              className="h-11"
              {...form.register('company')}
            />
          </div>

          {/* Message - Conversational prompt */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-muted-foreground">
              Anything you'd like us to know? <span className="text-xs">(optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Tell us about your brand challenges, what you're hoping to achieve, or just say hi! 👋"
              rows={3}
              className="resize-none"
              {...form.register('message')}
            />
          </div>

          {/* Submit Button - Warm CTA */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Let's Connect
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          {/* Trust message */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            💙 We reply within 24 hours • No spam, ever
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
