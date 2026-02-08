import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FloatingShapes } from './FloatingShapes';

export function AnimatedHero({ totalSections }: { totalSections: number }) {
  const navigate = useNavigate();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[80vh] flex items-center">
        {/* 3D Floating shapes */}
        <FloatingShapes />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none z-10" />
        
        {/* Animated mesh gradient */}
        <div className="absolute inset-0 opacity-30">
          <motion.div
            className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/30 rounded-full blur-[100px]"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]"
            animate={{
              x: [0, -80, 0],
              y: [0, -60, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[80px]"
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto text-center z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2 text-sm bg-background/50 backdrop-blur-sm border border-border/50">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              {totalSections}+ Powerful Sections
            </Badge>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Everything you need for
            <motion.span 
              className="block bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent bg-[length:200%_auto]"
              animate={{ backgroundPosition: ['0%', '200%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              complete brand guidelines
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            From color palettes to presentation templates, explore all the sections 
            available to build comprehensive, professional brand guidelines.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button size="lg" onClick={() => navigate('/auth')} className="gap-2">
              <Layers className="h-4 w-4" />
              Start Building
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/demo/brand/brandhub')} className="bg-background/50 backdrop-blur-sm">
              View Demo
            </Button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.div
              className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-1 h-2 bg-accent rounded-full"
                animate={{ y: [0, 8, 0], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
