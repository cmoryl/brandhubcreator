/**
 * TargetLanguagesPanel - Manage target languages for localization
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Globe2, GripVertical } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useLocalization } from '@/hooks/useLocalization';
import { SUPPORTED_LANGUAGES } from '@/types/localization';

export const TargetLanguagesPanel: React.FC = () => {
  const { organization } = useOrganization();
  const { 
    targetLanguages, 
    addLanguage, 
    removeLanguage, 
    toggleLanguageActive,
    isLoading 
  } = useLocalization(organization?.id);
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  // Filter out already added languages
  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    lang => !targetLanguages.some(tl => tl.language_code === lang.code)
  );

  const handleAddLanguage = () => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage);
    if (lang) {
      addLanguage.mutate({
        language_code: lang.code,
        language_name: lang.name,
      });
      setSelectedLanguage('');
    }
  };

  const handleRemove = (id: string) => {
    if (confirm('Remove this target language? This will not delete existing translations.')) {
      removeLanguage.mutate(id);
    }
  };

  // Group languages by region
  const activeLanguages = targetLanguages.filter(l => l.is_active);
  const inactiveLanguages = targetLanguages.filter(l => !l.is_active);

  return (
    <div className="space-y-6">
      {/* Add Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-5 w-5" />
            Add Target Language
          </CardTitle>
          <CardDescription>
            Select languages you want to translate your content into
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a language to add..." />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-64">
                  {availableLanguages.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {lang.code}
                        </span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddLanguage} 
              disabled={!selectedLanguage || addLanguage.isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Active Languages ({activeLanguages.length})</CardTitle>
          <CardDescription>
            Content will be translated into these languages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeLanguages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No target languages configured</p>
              <p className="text-sm">Add languages above to start localizing</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeLanguages.map((lang) => (
                <div 
                  key={lang.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div>
                      <p className="font-medium">{lang.language_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {lang.language_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-xs">Active</Badge>
                    <Switch
                      checked={lang.is_active}
                      onCheckedChange={(checked) => 
                        toggleLanguageActive.mutate({ id: lang.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(lang.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Languages */}
      {inactiveLanguages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              Inactive Languages ({inactiveLanguages.length})
            </CardTitle>
            <CardDescription>
              These languages are configured but not currently active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveLanguages.map((lang) => (
                <div 
                  key={lang.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-dashed opacity-60"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div>
                      <p className="font-medium">{lang.language_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {lang.language_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                    <Switch
                      checked={lang.is_active}
                      onCheckedChange={(checked) => 
                        toggleLanguageActive.mutate({ id: lang.id, is_active: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(lang.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TargetLanguagesPanel;
