import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Gradient builder with live manipulation
export function GradientExplorer() {
  const [angle, setAngle] = useState(135);
  const [colors, setColors] = useState(['#14b8a6', '#a855f7', '#3b82f6']);
  const [activeStop, setActiveStop] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAngle(a => (a + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const gradient = `linear-gradient(${angle}deg, ${colors.join(', ')})`;

  return (
    <div className="space-y-6">
      {/* Gradient preview */}
      <motion.div
        className="h-48 rounded-xl border border-border/50 relative overflow-hidden"
        style={{ background: gradient }}
      >
        {/* Animated overlay particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full"
            initial={{ 
              x: Math.random() * 300, 
              y: Math.random() * 200,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              x: Math.random() * 300,
              y: Math.random() * 200,
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}

        {/* CSS code display */}
        <div className="absolute bottom-3 left-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <code className="text-xs text-white/80 font-mono">
            background: linear-gradient({angle}deg, ...)
          </code>
        </div>
      </motion.div>

      {/* Color stops */}
      <div className="flex justify-center gap-3">
        {colors.map((color, i) => (
          <motion.button
            key={i}
            className={cn(
              "w-10 h-10 rounded-lg border-2 transition-all",
              activeStop === i ? "border-white scale-110 shadow-lg" : "border-transparent"
            )}
            style={{ backgroundColor: color }}
            onClick={() => setActiveStop(i)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />
        ))}
        <motion.button
          className="w-10 h-10 rounded-lg border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground"
          whileHover={{ scale: 1.1, borderColor: 'hsl(var(--accent))' }}
        >
          +
        </motion.button>
      </div>
    </div>
  );
}

// Pattern generator with live tiles
export function PatternExplorer() {
  const [pattern, setPattern] = useState(0);
  const [scale, setScale] = useState(20);
  const [rotation, setRotation] = useState(0);

  const patterns = [
    { name: 'Dots', svg: `<circle cx="10" cy="10" r="2" fill="currentColor"/>` },
    { name: 'Grid', svg: `<path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" stroke-width="0.5"/>` },
    { name: 'Diagonal', svg: `<path d="M 0 20 L 20 0" stroke="currentColor" stroke-width="0.5"/>` },
    { name: 'Waves', svg: `<path d="M 0 10 Q 5 5, 10 10 T 20 10" fill="none" stroke="currentColor" stroke-width="0.5"/>` },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(r => (r + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const patternSvg = `data:image/svg+xml,${encodeURIComponent(`<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g style="color: rgba(255,255,255,0.3)">${patterns[pattern].svg}</g></svg>`)}`;

  return (
    <div className="space-y-6">
      {/* Pattern preview */}
      <motion.div
        className="h-48 rounded-xl border border-border/50 bg-gradient-to-br from-accent/20 to-primary/20 relative overflow-hidden"
        style={{
          backgroundImage: `url("${patternSvg}")`,
          backgroundSize: `${scale}px ${scale}px`,
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl px-6 py-3 border border-border/50">
            <span className="font-semibold text-foreground">{patterns[pattern].name}</span>
          </div>
        </div>
      </motion.div>

      {/* Pattern selector */}
      <div className="flex justify-center gap-2">
        {patterns.map((p, i) => (
          <motion.button
            key={p.name}
            onClick={() => setPattern(i)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-all",
              pattern === i 
                ? "bg-accent text-accent-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {p.name}
          </motion.button>
        ))}
      </div>

      {/* Scale slider */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-xs text-muted-foreground">Small</span>
        <input
          type="range"
          min="10"
          max="40"
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="w-32 accent-accent"
        />
        <span className="text-xs text-muted-foreground">Large</span>
      </div>
    </div>
  );
}

// Photography style explorer
export function PhotographyExplorer() {
  const [filter, setFilter] = useState(0);
  const [zoom, setZoom] = useState(1);

  const filters = [
    { name: 'Natural', css: 'none' },
    { name: 'Warm', css: 'sepia(0.3) saturate(1.2)' },
    { name: 'Cool', css: 'hue-rotate(20deg) saturate(0.9)' },
    { name: 'B&W', css: 'grayscale(1)' },
    { name: 'Vivid', css: 'saturate(1.5) contrast(1.1)' },
  ];

  return (
    <div className="space-y-6">
      {/* Image preview */}
      <motion.div
        className="h-48 rounded-xl border border-border/50 overflow-hidden relative bg-gradient-to-br from-sky-400 to-blue-600"
        whileHover={{ scale: 1.02 }}
      >
        {/* Simulated landscape */}
        <div 
          className="absolute inset-0"
          style={{ 
            filter: filters[filter].css,
            transform: `scale(${zoom})`,
            transition: 'all 0.5s ease',
          }}
        >
          {/* Sun */}
          <motion.div
            className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200 to-orange-400"
            style={{ top: '20%', right: '25%' }}
            animate={{ 
              boxShadow: ['0 0 40px rgba(255,200,100,0.5)', '0 0 60px rgba(255,200,100,0.8)', '0 0 40px rgba(255,200,100,0.5)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Mountains */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-emerald-800 to-emerald-600" 
               style={{ clipPath: 'polygon(0 100%, 20% 40%, 40% 70%, 60% 30%, 80% 60%, 100% 20%, 100% 100%)' }} />
          {/* Foreground */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-emerald-900 to-emerald-700" />
        </div>

        {/* Filter label */}
        <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-xs text-white font-medium">{filters[filter].name}</span>
        </div>
      </motion.div>

      {/* Filter selector */}
      <div className="flex justify-center gap-2 flex-wrap">
        {filters.map((f, i) => (
          <motion.button
            key={f.name}
            onClick={() => setFilter(i)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs transition-all",
              filter === i 
                ? "bg-accent text-accent-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {f.name}
          </motion.button>
        ))}
      </div>

      {/* Zoom control */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-xs text-muted-foreground">1x</span>
        <input
          type="range"
          min="1"
          max="1.5"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-32 accent-accent"
        />
        <span className="text-xs text-muted-foreground">1.5x</span>
      </div>
    </div>
  );
}
