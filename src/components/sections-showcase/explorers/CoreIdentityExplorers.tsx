import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Color palette explorer with live color manipulation
export function ColorExplorer() {
  const [activeColor, setActiveColor] = useState(0);
  const [hue, setHue] = useState(180);
  
  const colors = [
    { name: 'Primary', hsl: `hsl(${hue}, 70%, 50%)` },
    { name: 'Secondary', hsl: `hsl(${hue + 30}, 60%, 55%)` },
    { name: 'Accent', hsl: `hsl(${hue + 180}, 65%, 50%)` },
    { name: 'Muted', hsl: `hsl(${hue}, 20%, 70%)` },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHue(h => (h + 1) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Color wheel visualization */}
      <div className="relative h-48 flex items-center justify-center">
        <motion.div
          className="absolute w-40 h-40 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, 
              hsl(0, 70%, 50%), 
              hsl(60, 70%, 50%), 
              hsl(120, 70%, 50%), 
              hsl(180, 70%, 50%), 
              hsl(240, 70%, 50%), 
              hsl(300, 70%, 50%), 
              hsl(360, 70%, 50%))`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-card border-4 border-background flex items-center justify-center"
          style={{ backgroundColor: colors[activeColor].hsl }}
          layoutId="activeColorCenter"
        >
          <span className="text-white font-bold text-sm drop-shadow-lg">
            {colors[activeColor].name}
          </span>
        </motion.div>
      </div>

      {/* Color swatches */}
      <div className="flex justify-center gap-3">
        {colors.map((color, i) => (
          <motion.button
            key={color.name}
            className={cn(
              "w-12 h-12 rounded-xl border-2 transition-all",
              activeColor === i ? "border-white scale-110 shadow-lg" : "border-transparent"
            )}
            style={{ backgroundColor: color.hsl }}
            onClick={() => setActiveColor(i)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          />
        ))}
      </div>

      {/* Color info */}
      <div className="text-center text-sm text-muted-foreground">
        <span className="font-mono">{colors[activeColor].hsl}</span>
      </div>
    </div>
  );
}

// Typography explorer with live font preview
export function TypographyExplorer() {
  const [activeFont, setActiveFont] = useState(0);
  const [fontSize, setFontSize] = useState(32);

  const fonts = [
    { name: 'Inter', family: 'Inter, sans-serif', style: 'Modern Sans' },
    { name: 'Playfair', family: 'Playfair Display, serif', style: 'Classic Serif' },
    { name: 'Space Grotesk', family: 'Space Grotesk, sans-serif', style: 'Geometric' },
    { name: 'DM Serif', family: 'DM Serif Display, serif', style: 'Editorial' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFont(f => (f + 1) % fonts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [fonts.length]);

  return (
    <div className="space-y-6">
      {/* Live preview */}
      <div className="h-48 flex items-center justify-center bg-muted/20 rounded-xl border border-border/50 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFont}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="text-center px-4"
          >
            <motion.h3
              className="text-foreground mb-2"
              style={{ 
                fontFamily: fonts[activeFont].family,
                fontSize: `${fontSize}px`,
              }}
            >
              Brand Typography
            </motion.h3>
            <p className="text-sm text-muted-foreground">
              {fonts[activeFont].style}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Font selector */}
      <div className="flex justify-center gap-2">
        {fonts.map((font, i) => (
          <motion.button
            key={font.name}
            onClick={() => setActiveFont(i)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-all",
              activeFont === i 
                ? "bg-accent text-accent-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {font.name}
          </motion.button>
        ))}
      </div>

      {/* Size slider */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-xs text-muted-foreground">Aa</span>
        <input
          type="range"
          min="20"
          max="48"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-32 accent-accent"
        />
        <span className="text-lg text-muted-foreground">Aa</span>
      </div>
    </div>
  );
}

// Logo explorer with variations
export function LogoExplorer() {
  const [activeVariant, setActiveVariant] = useState(0);
  const [bgColor, setBgColor] = useState('light');

  const variants = [
    { name: 'Primary', icon: '◆', color: 'hsl(var(--accent))' },
    { name: 'Monochrome', icon: '◆', color: bgColor === 'light' ? '#000' : '#fff' },
    { name: 'Icon Only', icon: '◆', color: 'hsl(var(--primary))' },
    { name: 'Horizontal', icon: '◆━', color: 'hsl(var(--accent))' },
  ];

  return (
    <div className="space-y-6">
      {/* Logo preview area */}
      <motion.div 
        className={cn(
          "h-48 rounded-xl border border-border/50 flex items-center justify-center transition-colors duration-500",
          bgColor === 'light' ? 'bg-white' : 'bg-zinc-900'
        )}
        layout
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeVariant}-${bgColor}`}
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
            className="flex items-center gap-3"
          >
            <span 
              className="text-5xl"
              style={{ color: variants[activeVariant].color }}
            >
              {variants[activeVariant].icon}
            </span>
            {activeVariant !== 2 && (
              <span 
                className="text-2xl font-bold"
                style={{ color: variants[activeVariant].color }}
              >
                Brand
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Variant selector */}
      <div className="flex justify-center gap-2 flex-wrap">
        {variants.map((variant, i) => (
          <motion.button
            key={variant.name}
            onClick={() => setActiveVariant(i)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs transition-all",
              activeVariant === i 
                ? "bg-accent text-accent-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {variant.name}
          </motion.button>
        ))}
      </div>

      {/* Background toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setBgColor('light')}
          className={cn(
            "w-8 h-8 rounded-full border-2 bg-white",
            bgColor === 'light' ? 'border-accent' : 'border-border'
          )}
        />
        <button
          onClick={() => setBgColor('dark')}
          className={cn(
            "w-8 h-8 rounded-full border-2 bg-zinc-900",
            bgColor === 'dark' ? 'border-accent' : 'border-border'
          )}
        />
      </div>
    </div>
  );
}
