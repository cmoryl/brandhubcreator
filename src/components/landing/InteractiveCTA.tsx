/**
 * Interactive CTA Section - Clean design matching hero aesthetic
 * Features: Subtle gradients, minimal motion, elegant buttons
 */

import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, Rocket } from 'lucide-react';

export function InteractiveCTA() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for subtle 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 100, mass: 0.8 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Subtle 3D perspective transforms
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [3, -3]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-3, 3]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <section 
      ref={containerRef}
      className="relative py-32 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Subtle gradient background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
      
      {/* Subtle radial glow */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, hsl(var(--primary) / 0.15), transparent)',
        }}
      />

      {/* Main content with subtle 3D perspective */}
      <motion.div 
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        style={{ perspective: 1200 }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center"
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Ready to Transform?</span>
          </motion.div>

          {/* Main headline */}
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-serif"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <span className="text-foreground">Let's </span>
            <span className="relative inline-block">
              <span className="text-primary">Build</span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              />
            </span>
            <span className="text-foreground"> Something</span>
            <br />
            <span className="text-accent">Amazing</span>
            <span className="text-foreground"> Together</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p 
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Join the brands that trust BrandHub for their identity management.
            Start your journey today.
          </motion.p>

          {/* Clean buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Primary CTA */}
            <motion.button
              onClick={() => navigate('/auth')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative px-8 py-4 rounded-xl font-semibold text-lg bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer flex items-center gap-2"
            >
              <Rocket className="h-5 w-5" />
              Get Started
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.button>

            {/* Secondary CTA */}
            <motion.button
              onClick={() => navigate('/demo/brand/brandhub')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-xl font-semibold text-lg bg-muted/50 border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Explore Demo
            </motion.button>
          </motion.div>

          {/* Subtle floating accents - much slower and less intrusive */}
          <div className="relative mt-16 h-24">
            <motion.div
              className="absolute left-1/4 top-0"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-12 h-12 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/30 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-muted-foreground/50" />
              </div>
            </motion.div>
            <motion.div
              className="absolute right-1/4 top-4"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <div className="w-10 h-10 rounded-xl bg-muted/30 backdrop-blur-sm border border-border/30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary/30" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Subtle bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-muted/20 to-transparent" />
    </section>
  );
}
