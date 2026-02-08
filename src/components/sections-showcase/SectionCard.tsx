import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, ExternalLink, Sparkles } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  capabilities: string[];
  gradient: string;
  index: number;
}

// Particle component for sparkle effects
function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 bg-accent rounded-full"
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        x: x,
        y: y,
      }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: "easeOut",
      }}
    />
  );
}

// Interactive icon with multiple states
function InteractiveIcon({ 
  icon: Icon, 
  isHovered, 
  isExpanded,
  onClick 
}: { 
  icon: React.ElementType; 
  isHovered: boolean;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const triggerParticles = useCallback(() => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: (Math.random() - 0.5) * 60,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  }, []);

  return (
    <motion.div 
      className="relative cursor-pointer"
      onClick={() => {
        triggerParticles();
        onClick();
      }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Particle effects */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {particles.map((particle, i) => (
          <Particle key={particle.id} delay={i * 0.05} x={particle.x} y={particle.y} />
        ))}
      </div>

      {/* Ripple ring */}
      <AnimatePresence>
        {isHovered && !isExpanded && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-accent"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </AnimatePresence>

      {/* Icon container */}
      <motion.div 
        className={cn(
          "relative p-3 rounded-xl border transition-all duration-500",
          isExpanded 
            ? "bg-accent text-accent-foreground border-accent" 
            : "bg-muted/50 border-border/50 group-hover:bg-accent/10 group-hover:border-accent/30"
        )}
        animate={isHovered ? { 
          scale: 1.1,
          rotate: [0, -5, 5, 0],
        } : { 
          scale: 1,
          rotate: 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Icon className={cn(
          "h-6 w-6 transition-colors duration-300",
          isExpanded ? "text-accent-foreground" : "text-muted-foreground group-hover:text-accent"
        )} />
      </motion.div>
    </motion.div>
  );
}

// Preview mockup component
function PreviewMockup({ title, gradient }: { title: string; gradient: string }) {
  return (
    <motion.div
      className="relative w-full h-32 rounded-lg overflow-hidden bg-muted/30 border border-border/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Mock UI elements */}
      <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", gradient)} />
      
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-muted/50 border-b border-border/30 flex items-center px-2 gap-1">
        <div className="w-2 h-2 rounded-full bg-red-400/50" />
        <div className="w-2 h-2 rounded-full bg-yellow-400/50" />
        <div className="w-2 h-2 rounded-full bg-green-400/50" />
      </div>
      
      {/* Content lines */}
      <div className="absolute top-10 left-3 right-3 space-y-2">
        <motion.div 
          className="h-2 bg-accent/30 rounded"
          initial={{ width: 0 }}
          animate={{ width: "60%" }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
        <motion.div 
          className="h-2 bg-muted-foreground/20 rounded"
          initial={{ width: 0 }}
          animate={{ width: "80%" }}
          transition={{ delay: 0.4, duration: 0.5 }}
        />
        <motion.div 
          className="h-2 bg-muted-foreground/20 rounded"
          initial={{ width: 0 }}
          animate={{ width: "45%" }}
          transition={{ delay: 0.5, duration: 0.5 }}
        />
      </div>

      {/* Floating elements */}
      <motion.div
        className={cn("absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-gradient-to-br", gradient)}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
}

export function SectionCard({ icon: Icon, title, description, capabilities, gradient, index }: SectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.05,
          ease: [0.22, 1, 0.36, 1]
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePosition({ x: 0, y: 0 });
        }}
        onMouseMove={handleMouseMove}
        onClick={() => setIsExpanded(true)}
        style={{
          transform: isHovered 
            ? `perspective(1000px) rotateX(${mousePosition.y * -5}deg) rotateY(${mousePosition.x * 5}deg) translateZ(5px)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
          transition: 'transform 0.3s ease-out',
        }}
        className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card cursor-pointer transition-all duration-500 hover:border-border hover:shadow-xl"
      >
        {/* Subtle gradient background */}
        <div 
          className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-30 transition-opacity duration-700", gradient)}
        />
        
        {/* Spotlight effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at ${(mousePosition.x + 0.5) * 100}% ${(mousePosition.y + 0.5) * 100}%, hsl(var(--accent) / 0.06), transparent 50%)`,
          }}
        />

        {/* Corner accent */}
        <motion.div 
          className="absolute top-0 right-0 w-20 h-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={cn("absolute top-0 right-0 w-full h-full bg-gradient-to-bl to-transparent", gradient.replace('/20', '/30'))} />
          <Sparkles className="absolute top-3 right-3 w-4 h-4 text-accent/60" />
        </motion.div>

        <div className="relative p-6 z-10">
          <div className="flex items-start gap-4 mb-4">
            <InteractiveIcon 
              icon={Icon} 
              isHovered={isHovered}
              isExpanded={false}
              onClick={() => setIsExpanded(true)}
            />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-foreground transition-colors duration-300">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {description}
              </p>
            </div>
          </div>

          {/* Capabilities with staggered animation */}
          <div className="space-y-2 mt-4">
            {capabilities.slice(0, 3).map((capability, i) => (
              <motion.div 
                key={i} 
                className="flex items-center gap-2 text-sm text-muted-foreground"
                initial={{ opacity: 0.6, x: 0 }}
                animate={isHovered ? { 
                  opacity: 1, 
                  x: 4,
                } : { 
                  opacity: 0.6, 
                  x: 0,
                }}
                transition={{ 
                  delay: i * 0.05, 
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
              >
                <motion.div
                  animate={isHovered ? { scale: 1.3, rotate: 90 } : { scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                >
                  <ChevronRight className="h-3 w-3 text-accent/60 group-hover:text-accent shrink-0 transition-colors duration-300" />
                </motion.div>
                <span className="group-hover:text-foreground/80 transition-colors duration-300">{capability}</span>
              </motion.div>
            ))}
            {capabilities.length > 3 && (
              <motion.div
                className="text-xs text-accent/70 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
              >
                +{capabilities.length - 3} more features
              </motion.div>
            )}
          </div>

          {/* Expand hint */}
          <motion.div
            className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <span>Click to explore</span>
            <ExternalLink className="w-3 h-3" />
          </motion.div>

          {/* Bottom accent line */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isHovered ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>

      {/* Expanded Modal */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header gradient */}
              <div className={cn("h-2 bg-gradient-to-r", gradient.replace('/20', ''))} />
              
              <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 rounded-full"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                  <motion.div 
                    className={cn("p-4 rounded-xl bg-gradient-to-br", gradient.replace('/20', ''))}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.1 }}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <div>
                    <motion.h2 
                      className="text-2xl font-bold text-foreground"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      {title}
                    </motion.h2>
                    <motion.p 
                      className="text-muted-foreground mt-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {description}
                    </motion.p>
                  </div>
                </div>

                {/* Preview mockup */}
                <PreviewMockup title={title} gradient={gradient.replace('/20', '')} />

                {/* Capabilities */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Features & Capabilities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {capabilities.map((capability, i) => (
                      <motion.div
                        key={i}
                        className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                      >
                        <div className={cn("w-2 h-2 rounded-full bg-gradient-to-r", gradient.replace('/20', ''))} />
                        <span className="text-sm text-foreground">{capability}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <motion.div 
                  className="flex gap-3 mt-6 pt-6 border-t border-border/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button className="flex-1 gap-2">
                    <Sparkles className="h-4 w-4" />
                    Try Demo
                  </Button>
                  <Button variant="outline" onClick={() => setIsExpanded(false)}>
                    Close
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
