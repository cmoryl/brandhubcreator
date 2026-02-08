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
          ? `perspective(1000px) rotateX(${mousePosition.y * -10}deg) rotateY(${mousePosition.x * 10}deg) translateZ(10px)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
        transition: 'transform 0.2s ease-out',
      }}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/50 transition-colors duration-500"
    >
      {/* Animated gradient background */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
      
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at ${(mousePosition.x + 0.5) * 100}% ${(mousePosition.y + 0.5) * 100}%, rgba(255,255,255,0.1), transparent 40%)`,
        }}
      />

      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-accent/50 via-primary/50 to-accent/50 blur-sm" />
      </div>

      <div className="relative p-6 z-10">
        <div className="flex items-start gap-4 mb-4">
          <motion.div 
            className="p-3 bg-accent/10 rounded-xl border border-accent/20"
            animate={isHovered ? { 
              scale: 1.1, 
              rotate: 5,
              borderColor: 'rgba(var(--accent), 0.5)'
            } : { 
              scale: 1, 
              rotate: 0 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Icon className="h-6 w-6 text-accent" />
          </motion.div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-accent transition-colors duration-300">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <motion.div 
          className="space-y-2 overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={isHovered ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {capabilities.map((capability, i) => (
            <motion.div 
              key={i} 
              className="flex items-center gap-2 text-sm text-muted-foreground"
              initial={{ x: -20, opacity: 0 }}
              animate={isHovered ? { x: 0, opacity: 1 } : { x: -20, opacity: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <ChevronRight className="h-3 w-3 text-accent shrink-0" />
              <span>{capability}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Always visible capabilities preview */}
        <div className={`space-y-1 transition-opacity duration-300 ${isHovered ? 'opacity-0 h-0' : 'opacity-100'}`}>
          <div className="flex flex-wrap gap-1 mt-3">
            {capabilities.slice(0, 2).map((capability, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent/80">
                {capability}
              </span>
            ))}
            {capabilities.length > 2 && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                +{capabilities.length - 2} more
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
