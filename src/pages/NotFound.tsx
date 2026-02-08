import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Floating particle component
const FloatingParticle = ({ delay, size, x, y }: { delay: number; size: number; x: number; y: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{
      opacity: [0, 0.6, 0],
      scale: [0, 1, 0.5],
      y: [0, -100, -200],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      ease: 'easeOut',
    }}
  />
);

// Orbiting icon component
const OrbitingIcon = ({ icon: Icon, delay, radius, duration }: { icon: React.ComponentType<{ className?: string }>; delay: number; radius: number; duration: number }) => (
  <motion.div
    className="absolute"
    style={{ width: radius * 2, height: radius * 2, left: '50%', top: '50%', marginLeft: -radius, marginTop: -radius }}
    animate={{ rotate: 360 }}
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
  >
    <motion.div
      className="absolute p-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20"
      style={{ top: 0, left: '50%', marginLeft: -16 }}
      animate={{ rotate: -360 }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    >
      <Icon className="h-5 w-5 text-primary" />
    </motion.div>
  </motion.div>
);

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Log the 404 error
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Track mouse for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate floating particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 4,
    size: Math.random() * 8 + 4,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }));

  return (
    <div className="min-h-screen bg-background overflow-hidden relative flex items-center justify-center">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <FloatingParticle key={p.id} {...p} />
      ))}

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center px-4 max-w-2xl mx-auto"
        style={{
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
        }}
      >
        {/* Large 404 with animation */}
        <div className="relative mb-8">
          {/* Orbiting icons */}
          <OrbitingIcon icon={Compass} delay={0} radius={120} duration={12} />
          <OrbitingIcon icon={Sparkles} delay={3} radius={150} duration={16} />
          
          {/* Glowing backdrop */}
          <motion.div
            className="absolute inset-0 blur-3xl bg-primary/20 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* The 404 numbers */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-[12rem] sm:text-[16rem] font-black leading-none tracking-tighter bg-gradient-to-b from-foreground via-foreground/80 to-foreground/40 bg-clip-text text-transparent select-none">
              404
            </h1>
            
            {/* Glitch effect overlay */}
            <motion.div
              className="absolute inset-0 text-[12rem] sm:text-[16rem] font-black leading-none tracking-tighter text-primary/20 select-none"
              animate={{
                x: [0, -2, 2, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
            >
              404
            </motion.div>
          </motion.div>
        </div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
            Lost in the digital void
          </h2>
          <p className="text-muted-foreground text-lg mb-2">
            The page you're looking for has wandered off into the unknown.
          </p>
          <p className="text-muted-foreground/60 text-sm font-mono mb-8">
            {location.pathname}
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Button
            size="lg"
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>
          <Button
            size="lg"
            onClick={() => navigate('/')}
            className="gap-2 group"
          >
            <Home className="h-4 w-4 transition-transform group-hover:scale-110" />
            Back to Home
          </Button>
        </motion.div>

        {/* Fun footer message */}
        <motion.p
          className="mt-12 text-xs text-muted-foreground/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Error Code: BRAND_NOT_FOUND • Status: Lost but not forgotten ✨
        </motion.p>
      </motion.div>

      {/* Corner decorations */}
      <motion.div
        className="absolute top-10 right-10 w-32 h-32 border border-primary/10 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-24 h-24 border border-accent/10 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
