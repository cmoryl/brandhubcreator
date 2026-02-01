/**
 * Interactive CTA Section with Advanced Mouse Tracking and 3D Effects
 * Features: Spatial recognition, magnetic buttons, particle trails, 3D perspective
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Rocket, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MousePosition {
  x: number;
  y: number;
}

interface FloatingOrb {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export function InteractiveCTA() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [clickRipples, setClickRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [trailParticles, setTrailParticles] = useState<{ id: number; x: number; y: number; opacity: number }[]>([]);

  // Motion values for smooth animations
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring physics
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // 3D perspective transforms
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);

  // Floating orbs for background
  const floatingOrbs: FloatingOrb[] = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 80 + 40,
    delay: Math.random() * 4,
    duration: Math.random() * 6 + 8,
  }));

  // Handle mouse movement
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Add trail particles
    if (isHovering && Math.random() > 0.7) {
      const newParticle = {
        id: Date.now() + Math.random(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        opacity: 1,
      };
      setTrailParticles(prev => [...prev.slice(-15), newParticle]);
    }
  }, [mouseX, mouseY, isHovering]);

  // Handle click ripple effect
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ripple = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setClickRipples(prev => [...prev, ripple]);
    setTimeout(() => {
      setClickRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 1000);
  }, []);

  // Fade out trail particles
  useEffect(() => {
    const interval = setInterval(() => {
      setTrailParticles(prev => 
        prev.map(p => ({ ...p, opacity: p.opacity - 0.1 }))
            .filter(p => p.opacity > 0)
      );
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative py-32 overflow-hidden cursor-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        mouseX.set(0);
        mouseY.set(0);
      }}
      onClick={handleClick}
    >
      {/* Dynamic gradient background */}
      <motion.div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(var(--primary) / 0.3), transparent 50%),
                       radial-gradient(circle at 20% 80%, hsl(var(--accent) / 0.2), transparent 40%),
                       radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.15), transparent 40%),
                       linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--background)), hsl(var(--accent) / 0.1))`,
        }}
      />

      {/* Floating orbs */}
      {floatingOrbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, hsl(var(--primary) / 0.15), transparent)`,
            filter: 'blur(20px)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.2, 0.9, 1],
            opacity: [0.3, 0.6, 0.4, 0.3],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Mouse trail particles */}
      <AnimatePresence>
        {trailParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: particle.x,
              top: particle.y,
              background: 'hsl(var(--primary))',
              boxShadow: '0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5)',
            }}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 0, opacity: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        ))}
      </AnimatePresence>

      {/* Click ripple effects */}
      <AnimatePresence>
        {clickRipples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full border-2 border-primary pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              translateX: '-50%',
              translateY: '-50%',
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 400, height: 400, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Custom cursor */}
      {isHovering && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{
            left: mousePosition.x + (containerRef.current?.getBoundingClientRect().left || 0),
            top: mousePosition.y + (containerRef.current?.getBoundingClientRect().top || 0),
            translateX: '-50%',
            translateY: '-50%',
          }}
        >
          <motion.div
            className="w-8 h-8 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              boxShadow: '0 0 20px hsl(var(--primary) / 0.5)',
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
        </motion.div>
      )}

      {/* Main content with 3D perspective */}
      <motion.div 
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        style={{
          perspective: 1000,
        }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center"
          style={{
            rotateX,
            rotateY,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Animated badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-primary">Ready to Transform?</span>
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Zap className="h-4 w-4 text-primary" />
            </motion.div>
          </motion.div>

          {/* Main headline with letter animation */}
          <motion.h2 
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-foreground">Let's </span>
            <motion.span 
              className="relative inline-block"
              whileHover={{ scale: 1.05 }}
            >
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                Build
              </span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent rounded-full"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
              />
            </motion.span>
            <span className="text-foreground"> Something</span>
            <br />
            <motion.span
              className="bg-gradient-to-r from-accent via-primary to-accent bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
              style={{ animationDelay: '0.5s' }}
            >
              Amazing
            </motion.span>
            <span className="text-foreground"> Together</span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p 
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Join the brands that trust BrandHub for their identity management.
            Start your journey today.
          </motion.p>

          {/* Interactive buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Primary CTA - Magnetic effect */}
            <MagneticButton onClick={() => navigate('/auth')} primary>
              <span className="relative z-10 flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </span>
            </MagneticButton>

            {/* Secondary CTA */}
            <MagneticButton onClick={() => navigate('/demo/brand/brandhub')}>
              <span className="relative z-10">Explore Demo</span>
            </MagneticButton>
          </motion.div>

          {/* Floating elements around buttons */}
          <div className="relative mt-12">
            <motion.div
              className="absolute -left-8 top-0"
              animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
            </motion.div>
            <motion.div
              className="absolute -right-8 top-4"
              animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 backdrop-blur-sm border border-accent/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-accent" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <motion.path
            fill="hsl(var(--primary) / 0.05)"
            d="M0,50 C360,100 720,0 1080,50 C1260,75 1350,25 1440,50 L1440,100 L0,100 Z"
            animate={{
              d: [
                "M0,50 C360,100 720,0 1080,50 C1260,75 1350,25 1440,50 L1440,100 L0,100 Z",
                "M0,60 C360,20 720,80 1080,40 C1260,20 1350,60 1440,30 L1440,100 L0,100 Z",
                "M0,50 C360,100 720,0 1080,50 C1260,75 1350,25 1440,50 L1440,100 L0,100 Z",
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            fill="hsl(var(--accent) / 0.03)"
            d="M0,70 C360,40 720,90 1080,60 C1260,45 1350,75 1440,60 L1440,100 L0,100 Z"
            animate={{
              d: [
                "M0,70 C360,40 720,90 1080,60 C1260,45 1350,75 1440,60 L1440,100 L0,100 Z",
                "M0,50 C360,80 720,30 1080,70 C1260,85 1350,55 1440,80 L1440,100 L0,100 Z",
                "M0,70 C360,40 720,90 1080,60 C1260,45 1350,75 1440,60 L1440,100 L0,100 Z",
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </svg>
      </div>
    </section>
  );
}

// Magnetic Button Component
interface MagneticButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}

function MagneticButton({ children, onClick, primary }: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 15, mass: 0.5 }}
      className={`
        relative px-8 py-4 rounded-xl font-semibold text-lg overflow-hidden
        transition-all duration-300 cursor-pointer
        ${primary 
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40' 
          : 'bg-background border border-border text-foreground hover:border-primary/50 hover:bg-primary/5'
        }
      `}
    >
      {/* Hover glow effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: primary 
                ? 'radial-gradient(circle at center, hsl(var(--primary-foreground) / 0.1), transparent 70%)'
                : 'radial-gradient(circle at center, hsl(var(--primary) / 0.1), transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Shimmer effect */}
      {primary && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={isHovered ? { x: '100%' } : { x: '-100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary-foreground) / 0.2), transparent)',
          }}
        />
      )}
      
      {children}
    </motion.button>
  );
}
