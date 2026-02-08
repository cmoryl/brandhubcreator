import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface SectionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  capabilities: string[];
  gradient: string;
  index: number;
}

export function SectionCard({ icon: Icon, title, description, capabilities, gradient, index }: SectionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  return (
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
      style={{
        transform: isHovered 
          ? `perspective(1000px) rotateX(${mousePosition.y * -5}deg) rotateY(${mousePosition.x * 5}deg) translateZ(5px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: 'transform 0.3s ease-out',
      }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-500 hover:border-border hover:shadow-xl"
    >
      {/* Subtle gradient background - much more muted */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-700`}
      />
      
      {/* Animated pattern overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--accent) / 0.03) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.03) 0%, transparent 50%),
                              radial-gradient(circle at 40% 80%, hsl(var(--accent) / 0.02) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Subtle spotlight effect following mouse */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${(mousePosition.x + 0.5) * 100}% ${(mousePosition.y + 0.5) * 100}%, hsl(var(--accent) / 0.04), transparent 50%)`,
        }}
      />

      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-accent/10 to-transparent" />
        <motion.div 
          className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent/40"
          animate={isHovered ? { scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>

      <div className="relative p-6 z-10">
        <div className="flex items-start gap-4 mb-4">
          {/* Icon container with subtle animation */}
          <div className="relative">
            <motion.div 
              className="p-3 bg-muted/50 rounded-xl border border-border/50 group-hover:bg-accent/10 group-hover:border-accent/20 transition-all duration-500"
              animate={isHovered ? { 
                scale: 1.05,
              } : { 
                scale: 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Icon className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors duration-500" />
            </motion.div>
            
            {/* Animated ring around icon */}
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-accent/0 group-hover:border-accent/20"
              animate={isHovered ? { 
                scale: [1, 1.15, 1.15],
                opacity: [0, 0.5, 0],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-foreground transition-colors duration-300">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Capabilities with staggered reveal */}
        <div className="space-y-2 mt-4">
          {capabilities.map((capability, i) => (
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
                animate={isHovered ? { scale: 1.2 } : { scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
              >
                <ChevronRight className="h-3 w-3 text-accent/60 group-hover:text-accent shrink-0 transition-colors duration-300" />
              </motion.div>
              <span className="group-hover:text-foreground/80 transition-colors duration-300">{capability}</span>
            </motion.div>
          ))}
        </div>

        {/* Bottom accent line */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={isHovered ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}
