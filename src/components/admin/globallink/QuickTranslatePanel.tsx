/**
 * QuickTranslatePanel - Quick translation testing and entity selection
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe2, Zap, FileText, Package, Calendar, 
  ArrowRight, Loader2, Copy, Check
} from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBrands } from '@/contexts/BrandContext';
import { useEvents } from '@/contexts/EventContext';
import { useLocalization } from '@/hooks/useLocalization';
import { SUPPORTED_LANGUAGES } from '@/types/localization';
import { toast } from 'sonner';

export const QuickTranslatePanel: React.FC = () => {
  const { organization } = useOrganization();
  const { brands, products } = useBrands();
  const { events } = useEvents();
  const { 
    targetLanguages, 
    translateContent, 
    submitJob,
    isTranslating,
    config
  } = useLocalization(organization?.id);
  
  const [activeTab, setActiveTab] = useState('text');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [entityType, setEntityType] = useState<'brand' | 'product' | 'event'>('brand');
  const [copied, setCopied] = useState(false);

  const activeLanguages = targetLanguages.filter(l => l.is_active);

  const handleQuickTranslate = async () => {
    if (!sourceText.trim() || !targetLanguage) {
      toast.error('Please enter text and select a target language');
      return;
    }

    const result = await translateContent({
      source_language: 'en_US',
      target_language: targetLanguage,
      content: sourceText,
    });

    if (result.success) {
      setTranslatedText(result.translated_content as string);
      toast.success(result.cached ? 'Translation from cache' : 'Translation complete');
    } else {
      toast.error(result.error || 'Translation failed');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitEntityJob = async () => {
    if (!selectedEntity || !targetLanguage) {
      toast.error('Please select an entity and target language');
      return;
    }

    let entityData: { id: string; name: string; guide_data?: Record<string, unknown> } | undefined;
    
    if (entityType === 'brand') {
      const brand = brands.find(b => b.id === selectedEntity);
      if (brand) entityData = { id: brand.id, name: brand.hero?.name || 'Unnamed Brand', guide_data: brand as unknown as Record<string, unknown> };
    } else if (entityType === 'product') {
      const product = products.find(p => p.id === selectedEntity);
      if (product) entityData = { id: product.id, name: product.hero?.name || 'Unnamed Product', guide_data: product as unknown as Record<string, unknown> };
    } else {
      const event = events.find(e => e.id === selectedEntity);
      if (event) entityData = { id: event.id, name: event.hero?.name || 'Unnamed Event', guide_data: event as unknown as Record<string, unknown> };
    }

    if (!entityData) {
      toast.error('Entity not found');
      return;
    }

    submitJob.mutate({
      entity_type: entityType,
      entity_id: entityData.id,
      entity_name: entityData.name,
      target_language: targetLanguage,
      source_content: entityData.guide_data || {},
    });
  };

  const entities = entityType === 'brand' 
    ? brands 
    : entityType === 'product' 
      ? products 
      : events;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Translate
          </CardTitle>
          <CardDescription>
            Test translations or submit full guides for localization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">Quick Text</TabsTrigger>
              <TabsTrigger value="entity">Full Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Source */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Source (English)</span>
                    <Badge variant="outline" className="text-xs">en_US</Badge>
                  </div>
                  <Textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Enter text to translate..."
                    className="min-h-[150px] resize-none"
                  />
                </div>

                {/* Target */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Translation</span>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue placeholder="Target language" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeLanguages.length > 0 ? (
                          activeLanguages.map(lang => (
                            <SelectItem key={lang.language_code} value={lang.language_code}>
                              {lang.language_name}
                            </SelectItem>
                          ))
                        ) : (
                          SUPPORTED_LANGUAGES.slice(0, 10).map(lang => (
                            <SelectItem key={lang.code} value={lang.code}>
                              {lang.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative">
                    <Textarea
                      value={translatedText}
                      readOnly
                      placeholder="Translation will appear here..."
                      className="min-h-[150px] resize-none bg-muted/50"
                    />
                    {translatedText && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe2 className="h-4 w-4" />
                  <span>
                    {config?.api_mode === 'live' 
                      ? 'Using GlobalLink Web API' 
                      : 'Demo mode - translations are simulated'}
                  </span>
                </div>
                <Button 
                  onClick={handleQuickTranslate}
                  disabled={isTranslating || !sourceText.trim() || !targetLanguage}
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      Translate
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="entity" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Entity Type */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Content Type</span>
                  <div className="flex gap-2">
                    <Button
                      variant={entityType === 'brand' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setEntityType('brand'); setSelectedEntity(''); }}
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Brand
                    </Button>
                    <Button
                      variant={entityType === 'product' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setEntityType('product'); setSelectedEntity(''); }}
                      className="flex-1"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      Product
                    </Button>
                    <Button
                      variant={entityType === 'event' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setEntityType('event'); setSelectedEntity(''); }}
                      className="flex-1"
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Event
                    </Button>
                  </div>
                </div>

                {/* Entity Selection */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Select {entityType}</span>
                  <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Choose a ${entityType}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Language */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Target Language</span>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLanguages.length > 0 ? (
                        activeLanguages.map(lang => (
                          <SelectItem key={lang.language_code} value={lang.language_code}>
                            {lang.language_name}
                          </SelectItem>
                        ))
                      ) : (
                        SUPPORTED_LANGUAGES.slice(0, 10).map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Submitting a full guide will create a translation job that processes all 
                  text content in the guide data. This includes identity, colors, typography, 
                  and all custom sections.
                </p>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitEntityJob}
                  disabled={submitJob.isPending || !selectedEntity || !targetLanguage}
                >
                  {submitJob.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Translation Job
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Translation Stats Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Brands Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{brands.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{products.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Events Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{events.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickTranslatePanel;
