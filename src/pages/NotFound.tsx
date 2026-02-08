import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Aurora color wave component
const AuroraWaves = () => (
  <div className="absolute inset-0 overflow-hidden">
    {/* Primary wave */}
    <motion.div
      className="absolute -inset-[100%] opacity-30"
      style={{
        background: 'conic-gradient(from 0deg at 50% 50%, hsl(var(--primary)) 0deg, hsl(280, 80%, 60%) 60deg, hsl(200, 90%, 50%) 120deg, hsl(var(--primary)) 180deg, hsl(320, 80%, 55%) 240deg, hsl(180, 70%, 50%) 300deg, hsl(var(--primary)) 360deg)',
        filter: 'blur(80px)',
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />
    {/* Secondary wave - counter rotation */}
    <motion.div
      className="absolute -inset-[50%] opacity-20"
      style={{
        background: 'conic-gradient(from 180deg at 50% 50%, hsl(260, 80%, 60%) 0deg, hsl(var(--primary)) 90deg, hsl(340, 75%, 55%) 180deg, hsl(200, 85%, 55%) 270deg, hsl(260, 80%, 60%) 360deg)',
        filter: 'blur(60px)',
      }}
      animate={{ rotate: -360 }}
      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

// Color-shifting floating particle
const ColorParticle = ({ delay, size, x, y, colorIndex }: { delay: number; size: number; x: number; y: number; colorIndex: number }) => {
  const colors = [
    'hsl(var(--primary))',
    'hsl(280, 80%, 60%)',
    'hsl(200, 90%, 50%)',
    'hsl(320, 80%, 55%)',
    'hsl(180, 70%, 50%)',
  ];
  
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ 
        width: size, 
        height: size, 
        left: `${x}%`, 
        top: `${y}%`,
        background: colors[colorIndex % colors.length],
        boxShadow: `0 0 ${size * 2}px ${colors[colorIndex % colors.length]}`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0.5],
        y: [0, -150, -300],
        x: [0, (Math.random() - 0.5) * 100],
      }}
      transition={{
        duration: 5,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
};

// Orbiting icon with color trail
const OrbitingIcon = ({ icon: Icon, delay, radius, duration, color }: { icon: React.ComponentType<{ className?: string }>; delay: number; radius: number; duration: number; color: string }) => (
  <motion.div
    className="absolute"
    style={{ width: radius * 2, height: radius * 2, left: '50%', top: '50%', marginLeft: -radius, marginTop: -radius }}
    animate={{ rotate: 360 }}
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
  >
    <motion.div
      className="absolute p-2 rounded-full backdrop-blur-sm border"
      style={{ 
        top: 0, 
        left: '50%', 
        marginLeft: -16,
        background: `${color}20`,
        borderColor: `${color}40`,
        boxShadow: `0 0 20px ${color}40`,
        color: color,
      }}
      animate={{ rotate: -360 }}
      transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    >
      <Icon className="h-5 w-5" />
    </motion.div>
  </motion.div>
);

// Animated gradient text for 404
const AnimatedGradientText = () => {
  const textRef = useRef<HTMLHeadingElement>(null);
  
  return (
    <motion.h1
      ref={textRef}
      className="text-[12rem] sm:text-[16rem] font-black leading-none tracking-tighter select-none relative"
      style={{
        background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(280, 80%, 60%), hsl(200, 90%, 50%), hsl(320, 80%, 55%), hsl(180, 70%, 50%), hsl(var(--primary)))',
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      404
    </motion.h1>
  );
};

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

  // Generate colorful floating particles
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    delay: Math.random() * 5,
    size: Math.random() * 10 + 6,
    x: Math.random() * 100,
    y: 60 + Math.random() * 40,
    colorIndex: i,
  }));

  return (
    <div className="min-h-screen bg-background overflow-hidden relative flex items-center justify-center">
      {/* Aurora color waves background */}
      <AuroraWaves />
      
      {/* Subtle vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, hsl(var(--background)) 70%)',
        }}
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Colorful floating particles */}
      {particles.map((p) => (
        <ColorParticle key={p.id} {...p} />
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
          {/* Orbiting icons with different colors */}
          <OrbitingIcon icon={Compass} delay={0} radius={120} duration={12} color="hsl(280, 80%, 60%)" />
          <OrbitingIcon icon={Sparkles} delay={3} radius={150} duration={16} color="hsl(180, 70%, 50%)" />
          
          {/* Multi-color glowing backdrop */}
          <motion.div
            className="absolute inset-0 blur-3xl rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.4), hsl(280, 80%, 60%, 0.3), hsl(200, 90%, 50%, 0.2))',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* The animated gradient 404 numbers */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatedGradientText />
            
            {/* Chromatic aberration / glitch effect layers */}
            <motion.div
              className="absolute inset-0 text-[12rem] sm:text-[16rem] font-black leading-none tracking-tighter select-none mix-blend-screen"
              style={{ color: 'hsl(0, 100%, 50%)', opacity: 0.1 }}
              animate={{
                x: [0, -3, 3, 0],
                opacity: [0, 0.15, 0],
              }}
              transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 2.5 }}
            >
              404
            </motion.div>
            <motion.div
              className="absolute inset-0 text-[12rem] sm:text-[16rem] font-black leading-none tracking-tighter select-none mix-blend-screen"
              style={{ color: 'hsl(180, 100%, 50%)', opacity: 0.1 }}
              animate={{
                x: [0, 3, -3, 0],
                opacity: [0, 0.15, 0],
              }}
              transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 2.5, delay: 0.05 }}
            >
              404
            </motion.div>
          </motion.div>
        </div>

        {/* Message with subtle gradient */}
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
          <motion.p 
            className="text-sm font-mono mb-8 px-3 py-1 rounded-full inline-block"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--primary) / 0.1), hsl(280, 80%, 60%, 0.1), hsl(200, 90%, 50%, 0.1))',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
          >
            <span className="text-muted-foreground/60">{location.pathname}</span>
          </motion.p>
        </motion.div>

        {/* Action buttons with gradient hover */}
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
            className="gap-2 group relative overflow-hidden"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Go Back
          </Button>
          <Button
            size="lg"
            onClick={() => navigate('/')}
            className="gap-2 group relative overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(280, 80%, 60%))',
            }}
          >
            <Home className="h-4 w-4 transition-transform group-hover:scale-110" />
            Back to Home
          </Button>
        </motion.div>

        {/* Fun footer message with shimmer */}
        <motion.p
          className="mt-12 text-xs text-muted-foreground/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Error Code: BRAND_NOT_FOUND • Status: Lost but not forgotten ✨
        </motion.p>
      </motion.div>

      {/* Corner decorations with color */}
      <motion.div
        className="absolute top-10 right-10 w-32 h-32 rounded-full"
        style={{ border: '1px solid hsl(280, 80%, 60%, 0.2)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-24 h-24 rounded-full"
        style={{ border: '1px solid hsl(180, 70%, 50%, 0.2)' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute top-1/4 left-10 w-16 h-16 rounded-full"
        style={{ border: '1px solid hsl(320, 80%, 55%, 0.15)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-10 w-20 h-20 rounded-full"
        style={{ border: '1px solid hsl(200, 90%, 50%, 0.15)' }}
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
