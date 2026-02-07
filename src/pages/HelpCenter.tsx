import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Building2,
  Rocket,
  Zap,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  Link2,
  FileText,
  Image,
  Shapes,
  Palette,
  Type,
  Sparkles,
  MessageSquare,
  Camera,
  Briefcase,
  LayoutTemplate,
  Globe,
  LayoutList,
  Link,
  Users,
  Plus,
  Eye,
  Boxes,
  Wand2,
  BarChart3,
  TrendingUp,
  Brain,
  Database,
  FileDown,
  Keyboard,
  Newspaper,
  GitBranch,
} from 'lucide-react';
import {
  helpCategories,
  helpSections,
  searchHelpContent,
  getSectionsByCategory,
  getRelatedSections,
  type HelpSection,
  type HelpCategory,
} from '@/lib/helpContent';

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  BookOpen,
  Building2,
  Zap,
  Plus,
  FileText,
  Image,
  Shapes,
  Palette,
  Type,
  Sparkles,
  MessageSquare,
  Camera,
  Briefcase,
  LayoutTemplate,
  Globe,
  LayoutList,
  Link,
  Users,
  Eye,
  Boxes,
  Wand2,
  BarChart3,
  TrendingUp,
  Brain,
  Database,
  FileDown,
  Keyboard,
  Newspaper,
  GitBranch,
};

const HelpCenter = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  const selectedSectionId = searchParams.get('section');
  const selectedCategoryId = searchParams.get('category');
  
  const selectedSection = useMemo(() => 
    helpSections.find(s => s.id === selectedSectionId),
    [selectedSectionId]
  );

  const filteredSections = useMemo(() => {
    if (searchQuery.trim()) {
      return searchHelpContent(searchQuery);
    }
    if (selectedCategoryId) {
      return getSectionsByCategory(selectedCategoryId as HelpSection['category']);
    }
    return helpSections;
  }, [searchQuery, selectedCategoryId]);

  const relatedSections = useMemo(() => {
    if (selectedSectionId) {
      return getRelatedSections(selectedSectionId);
    }
    return [];
  }, [selectedSectionId]);

  const handleSectionClick = (sectionId: string) => {
    setSearchParams({ section: sectionId });
  };

  const handleCategoryClick = (categoryId: string) => {
    setSearchParams({ category: categoryId });
  };

  const handleBackToList = () => {
    if (selectedCategoryId) {
      setSearchParams({ category: selectedCategoryId });
    } else {
      setSearchParams({});
    }
  };

  const renderIcon = (iconName: string, className = "h-5 w-5") => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon className={className} /> : <FileText className={className} />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold text-lg">Help Center</h1>
                  <p className="text-sm text-muted-foreground">Step-by-step guides & tutorials</p>
                </div>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative w-80 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchParams({});
                }}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Mobile Search */}
          <div className="relative mt-4 md:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchParams({});
              }}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Detail View */}
        {selectedSection ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button 
                  onClick={() => setSearchParams({})}
                  className="hover:text-foreground transition-colors"
                >
                  Help Center
                </button>
                <ChevronRight className="h-4 w-4" />
                <button 
                  onClick={() => handleCategoryClick(selectedSection.category)}
                  className="hover:text-foreground transition-colors capitalize"
                >
                  {selectedSection.category.replace('-', ' ')}
                </button>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{selectedSection.title}</span>
              </div>

              {/* Section Header */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  {renderIcon(selectedSection.icon, "h-6 w-6 text-primary")}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{selectedSection.title}</h1>
                  <p className="text-muted-foreground mt-1">{selectedSection.description}</p>
                </div>
              </div>

              {/* Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Step-by-Step Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedSection.steps.map((step, index) => (
                      <div key={step.id} className="relative">
                        {/* Step Number */}
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <h3 className="font-semibold text-lg">{step.title}</h3>
                            <p className="text-muted-foreground">{step.description}</p>
                            
                            {/* Tips */}
                            {step.tips && step.tips.length > 0 && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-primary font-medium text-sm">
                                  <Lightbulb className="h-4 w-4" />
                                  Tips
                                </div>
                                <ul className="space-y-1">
                                  {step.tips.map((tip, tipIndex) => (
                                    <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Warning */}
                            {step.warning && (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-sm text-amber-700 dark:text-amber-400">{step.warning}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Connector Line */}
                        {index < selectedSection.steps.length - 1 && (
                          <div className="absolute left-4 top-10 bottom-0 w-px bg-border -translate-x-1/2 h-6" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Back Button */}
              <Button variant="outline" onClick={handleBackToList}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {selectedCategoryId ? 'Category' : 'All Articles'}
              </Button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Keywords */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Related Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedSection.keywords.map((keyword) => (
                      <Badge 
                        key={keyword} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => setSearchQuery(keyword)}
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Related Sections */}
              {relatedSections.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Related Guides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {relatedSections.map((related) => (
                      <button
                        key={related.id}
                        onClick={() => handleSectionClick(related.id)}
                        className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        {renderIcon(related.icon, "h-4 w-4 text-muted-foreground")}
                        <span className="text-sm">{related.title}</span>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Category Cards */}
            {!searchQuery && !selectedCategoryId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {helpCategories.map((category) => (
                  <Card 
                    key={category.id}
                    className="cursor-pointer hover:border-primary/50 transition-colors group"
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                          {renderIcon(category.icon, "h-5 w-5 text-primary")}
                        </div>
                        <CardTitle className="text-base">{category.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{category.description}</CardDescription>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getSectionsByCategory(category.id as HelpSection['category']).length} articles
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Section List Header */}
            {(selectedCategoryId || searchQuery) && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {selectedCategoryId && (
                    <Button variant="ghost" size="sm" onClick={() => setSearchParams({})}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      All Categories
                    </Button>
                  )}
                  <h2 className="text-xl font-semibold capitalize">
                    {searchQuery 
                      ? `Search results for "${searchQuery}"`
                      : selectedCategoryId?.replace('-', ' ')
                    }
                  </h2>
                </div>
                <Badge variant="outline">
                  {filteredSections.length} article{filteredSections.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}

            {/* Section List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSections.map((section) => (
                <Card 
                  key={section.id}
                  className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                  onClick={() => handleSectionClick(section.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                          {renderIcon(section.icon, "h-4 w-4 text-muted-foreground group-hover:text-primary")}
                        </div>
                        <div>
                          <CardTitle className="text-base leading-tight">{section.title}</CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs capitalize">
                            {section.category.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">{section.description}</CardDescription>
                    <p className="text-xs text-muted-foreground mt-2">
                      {section.steps.length} step{section.steps.length !== 1 ? 's' : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredSections.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No articles found</h3>
                <p className="text-muted-foreground">Try a different search term or browse categories</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchParams({});
                  }}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default HelpCenter;
