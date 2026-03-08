import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Loader2, 
  CheckCircle, 
  Layers, 
  BarChart3, 
  Users, 
  Zap, 
  HelpCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const interestOptions = [
  { id: 'brand-guides', label: 'Brand Guide Creation', icon: Layers },
  { id: 'analytics', label: 'Brand Analytics & Reporting', icon: BarChart3 },
  { id: 'team', label: 'Team Collaboration', icon: Users },
  { id: 'ai-features', label: 'AI-Powered Features', icon: Zap },
];

const roleOptions = [
  { value: 'marketing', label: 'Marketing / Brand Manager' },
  { value: 'design', label: 'Designer / Creative' },
  { value: 'executive', label: 'Executive / Leadership' },
  { value: 'agency', label: 'Agency / Consultant' },
  { value: 'other', label: 'Other' },
];

interface LearnMoreFormProps {
  onClose?: () => void;
}

export function LearnMoreForm({ onClose }: LearnMoreFormProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    interests: [] as string[],
    role: '',
    companySize: '',
    name: '',
    email: '',
    message: '',
  });

  const toggleInterest = (id: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.name) {
      toast.error('Please fill in your name and email');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call - in production, this would submit to your backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    logger.debug('Learn More submission:', formData);
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast.success('Thank you! We\'ll be in touch soon.');
    
    // Auto-close after success
    setTimeout(() => {
      onClose?.();
    }, 3000);
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-12 animate-scale-in">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">You're all set!</h3>
        <p className="text-muted-foreground mb-6">
          Our team will reach out within 24 hours to discuss how BrandHub can help you.
        </p>
        <Button onClick={() => navigate('/auth')} className="gap-2">
          Create a Free Account
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s === step
                  ? 'bg-accent text-white scale-110'
                  : s < step
                  ? 'bg-accent/20 text-accent'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-0.5 ${s < step ? 'bg-accent' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Interests */}
      {step === 1 && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">Step 1 of 3</Badge>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              What are you interested in?
            </h3>
            <p className="text-muted-foreground text-sm">
              Select all that apply to help us understand your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {interestOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.interests.includes(option.id);
              
              return (
                <button
                  key={option.id}
                  onClick={() => toggleInterest(option.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                    isSelected
                      ? 'border-accent bg-accent/10 shadow-md'
                      : 'border-border hover:border-accent/50 bg-card/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-accent/20' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {option.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          
          <Button 
            onClick={() => setStep(2)} 
            className="w-full gap-2"
            disabled={formData.interests.length === 0}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Role & Company */}
      {step === 2 && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">Step 2 of 3</Badge>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Tell us about yourself
            </h3>
            <p className="text-muted-foreground text-sm">
              This helps us tailor our recommendations
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-3 block">Your Role</Label>
              <RadioGroup 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                className="grid grid-cols-1 gap-2"
              >
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50 ${
                      formData.role === option.value ? 'border-accent bg-accent/5' : 'border-border'
                    }`}
                  >
                    <RadioGroupItem value={option.value} />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="companySize" className="text-sm font-medium">Company Size</Label>
              <select
                id="companySize"
                value={formData.companySize}
                onChange={(e) => setFormData(prev => ({ ...prev, companySize: e.target.value }))}
                className="w-full mt-2 h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Select company size...</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={() => setStep(3)} 
              className="flex-1 gap-2"
              disabled={!formData.role}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Contact Info */}
      {step === 3 && (
        <div className="animate-fade-in space-y-6">
          <div className="text-center">
            <Badge variant="secondary" className="mb-3">Step 3 of 3</Badge>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              How can we reach you?
            </h3>
            <p className="text-muted-foreground text-sm">
              We'll send you personalized information based on your interests
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label htmlFor="email">Work Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@company.com"
                className="mt-1.5"
              />
            </div>
            
            <div>
              <Label htmlFor="message">Anything specific you'd like to know?</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Tell us about your brand management challenges..."
                className="mt-1.5 min-h-[80px]"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
              Back
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name || !formData.email}
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree to receive information about BrandHub. 
            You can unsubscribe at any time.
          </p>
        </div>
      )}
    </div>
  );
}

// Standalone card component for embedding in pages
export function LearnMoreCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card className="overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-card via-card to-accent/5">
      <CardContent className="p-0">
        {!isExpanded ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center animate-bounce-gentle">
              <HelpCircle className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">
              Want to learn more?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Tell us about your needs and we'll show you how BrandHub can transform your brand management.
            </p>
            <Button 
              size="lg" 
              onClick={() => setIsExpanded(true)}
              className="gap-2 group"
            >
              <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              Get Started
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <LearnMoreForm onClose={() => setIsExpanded(false)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
