/**
 * GetStartedSurveyModal - Contact survey form for lead capture
 * Saves submissions to database for admin review
 */

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send, CheckCircle, Building2, Users, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const surveySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  company: z.string().trim().max(100, 'Company name must be less than 100 characters').optional(),
  role: z.string().trim().max(100, 'Role must be less than 100 characters').optional(),
  teamSize: z.string().optional(),
  useCase: z.string().optional(),
  message: z.string().trim().max(1000, 'Message must be less than 1000 characters').optional(),
});

type SurveyFormData = z.infer<typeof surveySchema>;

interface GetStartedSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEAM_SIZES = [
  { value: '1', label: 'Just me' },
  { value: '2-5', label: '2-5 people' },
  { value: '6-20', label: '6-20 people' },
  { value: '21-50', label: '21-50 people' },
  { value: '51-200', label: '51-200 people' },
  { value: '200+', label: '200+ people' },
];

const USE_CASES = [
  { value: 'brand-guidelines', label: 'Brand Guidelines Management' },
  { value: 'product-branding', label: 'Product Branding' },
  { value: 'event-branding', label: 'Event Branding' },
  { value: 'agency-clients', label: 'Managing Client Brands (Agency)' },
  { value: 'rebrand', label: 'Company Rebrand' },
  { value: 'startup', label: 'New Startup Branding' },
  { value: 'other', label: 'Other' },
];

export function GetStartedSurveyModal({ open, onOpenChange }: GetStartedSurveyModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<SurveyFormData>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      role: '',
      teamSize: '',
      useCase: '',
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
        role: data.role || null,
        team_size: data.teamSize || null,
        use_case: data.useCase || null,
        message: data.message || null,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Thank you! We\'ll be in touch soon.');
      
      // Reset after brief delay
      setTimeout(() => {
        onOpenChange(false);
        setIsSuccess(false);
        form.reset();
      }, 2000);
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
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground">
              We've received your information and will be in touch shortly.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Get Started with BrandHub
          </DialogTitle>
          <DialogDescription>
            Tell us about yourself and your needs. We'll reach out to help you get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Name & Email Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Your name"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Company & Role Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Company
              </Label>
              <Input
                id="company"
                placeholder="Company name"
                {...form.register('company')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                Role
              </Label>
              <Input
                id="role"
                placeholder="Your role"
                {...form.register('role')}
              />
            </div>
          </div>

          {/* Team Size & Use Case Row */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Team Size
              </Label>
              <Select
                value={form.watch('teamSize')}
                onValueChange={(value) => form.setValue('teamSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team size" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary Use Case</Label>
              <Select
                value={form.watch('useCase')}
                onValueChange={(value) => form.setValue('useCase', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select use case" />
                </SelectTrigger>
                <SelectContent>
                  {USE_CASES.map((uc) => (
                    <SelectItem key={uc.value} value={uc.value}>
                      {uc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Tell us more (optional)</Label>
            <Textarea
              id="message"
              placeholder="What are you hoping to achieve with BrandHub?"
              rows={3}
              {...form.register('message')}
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Request
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. Your information will only be used to contact you about BrandHub.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
