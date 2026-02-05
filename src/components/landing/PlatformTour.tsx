/**
 * PlatformTour - Interactive section showcasing BrandHub platform capabilities
 * Features user vs viewer comparison and feature highlights
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Eye, Users, Plus, Upload, Palette, Type, Brain, Settings, 
  FileText, Download, Copy, Bookmark, Smartphone, Lock, Search, QrCode,
  Share2, Layers, Cloud, Zap, CheckCircle, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PLATFORM_FEATURES, USER_VIEWER_COMPARISON } from '@/data/demoBrandHub';

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Plus, Upload, Palette, Type, Brain, Settings, FileText, Download, Copy,
  Bookmark, Smartphone, Lock, Search, QrCode, Eye, Users, Share2, Layers, Cloud, Zap,
};

interface PlatformTourProps {
  onDemoClick?: () => void;
}

export const PlatformTour: React.FC<PlatformTourProps> = ({ onDemoClick }) => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState<string>('create');
  const [viewMode, setViewMode] = useState<'users' | 'viewers'>('users');

  const activeFeatureData = PLATFORM_FEATURES.find(f => f.id === activeFeature);

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-muted/50 via-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-4 text-accent border-accent/30">
            <Play className="h-3 w-3 mr-1" />
            Platform Tour
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
            See BrandHub in Action
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover how teams create, manage, and share comprehensive brand guidelines
          </p>
        </div>

        {/* Feature Cards - Horizontal scroll on mobile, grid on desktop */}
        <div className="mb-12 sm:mb-16 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 sm:pb-0 sm:grid sm:grid-cols-4 snap-x snap-mandatory scrollbar-hide touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
            {PLATFORM_FEATURES.map((feature) => {
              const Icon = ICON_MAP[feature.icon] || Zap;
              const isActive = activeFeature === feature.id;
              
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={cn(
                    'flex-shrink-0 w-[180px] sm:w-auto snap-start p-3 sm:p-6 rounded-xl border-2 transition-all duration-300 text-left touch-manipulation',
                    isActive 
                      ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10' 
                      : 'border-border bg-card hover:border-accent/50'
                  )}
                >
                  <div 
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3"
                    style={{ backgroundColor: `${feature.color}20` }}
                  >
                    <Icon className="h-4 w-4 sm:h-6 sm:w-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">{feature.title}</h3>
                  <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-2">
                    {feature.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Feature Details */}
        {activeFeatureData && (
          <Card className="mb-12 sm:mb-16 border-2 border-accent/20 bg-gradient-to-br from-card to-muted/30 overflow-hidden mx-0">
            <CardContent className="p-4 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
                {/* Feature Info */}
                <div>
                  <div 
                    className="inline-flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full mb-3 sm:mb-4"
                    style={{ backgroundColor: `${activeFeatureData.color}20` }}
                  >
                    {(() => {
                      const Icon = ICON_MAP[activeFeatureData.icon] || Zap;
                      return <Icon className="h-4 w-4" style={{ color: activeFeatureData.color }} />;
                    })()}
                    <span className="text-xs sm:text-sm font-medium" style={{ color: activeFeatureData.color }}>
                      {activeFeatureData.title}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-semibold text-foreground mb-3">
                    {activeFeatureData.description}
                  </h3>
                  <ul className="space-y-2 sm:space-y-3">
                    {activeFeatureData.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 sm:gap-3">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Feature Visual - Hidden on mobile for cleaner layout */}
                <div className="relative hidden md:block">
                  <div 
                    className="aspect-video rounded-xl flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${activeFeatureData.color}15 0%, ${activeFeatureData.color}05 100%)`,
                      border: `1px solid ${activeFeatureData.color}30`,
                    }}
                  >
                    <div className="text-center p-6">
                      {(() => {
                        const Icon = ICON_MAP[activeFeatureData.icon] || Zap;
                        return <Icon className="h-16 w-16 mx-auto mb-4 opacity-50" style={{ color: activeFeatureData.color }} />;
                      })()}
                      <p className="text-sm text-muted-foreground">
                        Interactive preview coming soon
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User vs Viewer Comparison */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              Two Experiences, One Platform
            </h3>
            <p className="text-muted-foreground">
              Whether you're creating or consuming, BrandHub adapts to your needs
            </p>
          </div>

          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-muted rounded-lg p-1 w-full sm:w-auto max-w-xs sm:max-w-none">
              <button
                onClick={() => setViewMode('users')}
                className={cn(
                  'flex-1 sm:flex-none px-3 sm:px-6 py-2.5 sm:py-2 rounded-md text-sm font-medium transition-all touch-manipulation',
                  viewMode === 'users' 
                    ? 'bg-accent text-accent-foreground shadow' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Creators
              </button>
              <button
                onClick={() => setViewMode('viewers')}
                className={cn(
                  'flex-1 sm:flex-none px-3 sm:px-6 py-2.5 sm:py-2 rounded-md text-sm font-medium transition-all touch-manipulation',
                  viewMode === 'viewers' 
                    ? 'bg-accent text-accent-foreground shadow' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                Viewers
              </button>
            </div>
          </div>

          {/* Comparison Content */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={viewMode}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={{
                hidden: { opacity: 0 },
                visible: { 
                  opacity: 1,
                  transition: { staggerChildren: 0.05, delayChildren: 0.1 }
                },
                exit: { 
                  opacity: 0,
                  transition: { duration: 0.15 }
                }
              }}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
            >
              {USER_VIEWER_COMPARISON[viewMode].capabilities.map((cap, idx) => {
                const Icon = ICON_MAP[cap.icon] || CheckCircle;
                return (
                  <motion.div
                    key={`${viewMode}-${idx}`}
                    variants={{
                      hidden: { 
                        opacity: 0, 
                        y: 20,
                        scale: 0.95
                      },
                      visible: { 
                        opacity: 1, 
                        y: 0,
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 100,
                          damping: 15
                        }
                      },
                      exit: {
                        opacity: 0,
                        scale: 0.95,
                        transition: { duration: 0.1 }
                      }
                    }}
                  >
                    <Card 
                      className="border bg-card hover:border-accent/50 transition-colors touch-manipulation h-full"
                    >
                      <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-foreground leading-tight">{cap.label}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Role Description */}
          <div className="mt-6 text-center">
            <p className="text-base sm:text-lg font-medium text-foreground">
              {USER_VIEWER_COMPARISON[viewMode].title}
            </p>
            <p className="text-sm text-muted-foreground">
              {USER_VIEWER_COMPARISON[viewMode].subtitle}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => navigate('/demo/brand/brandhub')}
            >
              <Eye className="h-5 w-5" />
              View BrandHub Guide
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/auth')}
            >
              <Plus className="h-5 w-5" />
              Start Creating
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformTour;
