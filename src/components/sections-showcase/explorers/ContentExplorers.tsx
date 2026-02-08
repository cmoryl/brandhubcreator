import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FileText, Layout, Smartphone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Presentation/document carousel
export function DocumentExplorer() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const slides = [
    { title: 'Cover Slide', color: 'from-blue-500 to-indigo-600' },
    { title: 'About Us', color: 'from-purple-500 to-pink-500' },
    { title: 'Services', color: 'from-teal-500 to-cyan-500' },
    { title: 'Contact', color: 'from-orange-500 to-red-500' },
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveSlide(s => (s + 1) % slides.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  return (
    <div className="space-y-6">
      {/* Slide preview */}
      <div className="relative h-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: 50, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -50, rotateY: 15 }}
            className={cn(
              "absolute inset-0 rounded-xl bg-gradient-to-br p-6 flex flex-col justify-between",
              slides[activeSlide].color
            )}
            style={{ perspective: '1000px' }}
          >
            {/* Slide header */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">◆</span>
              </div>
              <span className="text-white/80 text-sm">Brand Presentation</span>
            </div>

            {/* Slide title */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {slides[activeSlide].title}
              </h3>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-1 bg-white/30 rounded" style={{ width: `${60 - i * 15}%` }} />
                ))}
              </div>
            </div>

            {/* Slide number */}
            <div className="text-white/60 text-sm">
              Slide {activeSlide + 1} of {slides.length}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={() => setActiveSlide(s => (s - 1 + slides.length) % slides.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveSlide(s => (s + 1) % slides.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slide thumbnails */}
      <div className="flex justify-center gap-2">
        {slides.map((slide, i) => (
          <motion.button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={cn(
              "w-12 h-8 rounded-md bg-gradient-to-br transition-all",
              slide.color,
              activeSlide === i ? "ring-2 ring-white ring-offset-2 ring-offset-background" : "opacity-50"
            )}
            whileHover={{ scale: 1.1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
          />
        ))}
      </div>
    </div>
  );
}

// Social media mockup explorer
export function SocialExplorer() {
  const [platform, setPlatform] = useState(0);
  const [format, setFormat] = useState(0);

  const platforms = [
    { name: 'Instagram', icon: '📷', color: 'from-pink-500 via-purple-500 to-orange-500' },
    { name: 'LinkedIn', icon: '💼', color: 'from-blue-600 to-blue-700' },
    { name: 'Twitter', icon: '🐦', color: 'from-sky-400 to-sky-500' },
    { name: 'YouTube', icon: '▶️', color: 'from-red-500 to-red-600' },
  ];

  const formats = ['Feed', 'Story', 'Banner'];

  const aspectRatios: Record<string, string> = {
    'Feed': '1/1',
    'Story': '9/16',
    'Banner': '16/9',
  };

  return (
    <div className="space-y-6">
      {/* Platform preview */}
      <div className="h-48 flex items-center justify-center">
        <motion.div
          key={`${platform}-${format}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "bg-gradient-to-br rounded-xl flex items-center justify-center relative overflow-hidden",
            platforms[platform].color
          )}
          style={{ 
            aspectRatio: aspectRatios[formats[format]],
            height: formats[format] === 'Story' ? '180px' : formats[format] === 'Banner' ? '100px' : '150px',
          }}
        >
          {/* Platform icon */}
          <span className="text-4xl">{platforms[platform].icon}</span>

          {/* Format label */}
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-0.5">
            <span className="text-xs text-white">{formats[format]}</span>
          </div>

          {/* Dimensions */}
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded px-2 py-0.5">
            <span className="text-xs text-white font-mono">
              {formats[format] === 'Feed' ? '1080×1080' : formats[format] === 'Story' ? '1080×1920' : '1584×396'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Platform selector */}
      <div className="flex justify-center gap-2">
        {platforms.map((p, i) => (
          <motion.button
            key={p.name}
            onClick={() => setPlatform(i)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1",
              platform === i 
                ? "bg-accent text-accent-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{p.icon}</span>
            <span className="hidden sm:inline">{p.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Format selector */}
      <div className="flex justify-center gap-2">
        {formats.map((f, i) => (
          <motion.button
            key={f}
            onClick={() => setFormat(i)}
            className={cn(
              "px-3 py-1 rounded-full text-xs transition-all",
              format === i 
                ? "bg-foreground text-background" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
          >
            {f}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Email template explorer
export function EmailExplorer() {
  const [section, setSection] = useState<'header' | 'body' | 'footer'>('header');

  return (
    <div className="space-y-6">
      {/* Email preview */}
      <div className="h-48 bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Email header */}
        <motion.div
          className={cn(
            "h-12 bg-gradient-to-r from-accent to-primary flex items-center px-4 transition-all",
            section === 'header' ? "ring-2 ring-accent ring-offset-2" : ""
          )}
          onClick={() => setSection('header')}
          whileHover={{ scale: section === 'header' ? 1 : 1.01 }}
        >
          <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">◆</span>
          </div>
          <span className="ml-2 text-white font-medium text-sm">Brand Newsletter</span>
        </motion.div>

        {/* Email body */}
        <motion.div
          className={cn(
            "p-4 space-y-2 transition-all cursor-pointer",
            section === 'body' ? "ring-2 ring-accent ring-inset" : ""
          )}
          onClick={() => setSection('body')}
        >
          <div className="h-2 bg-gray-200 rounded w-3/4" />
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
          <div className="h-6 bg-accent rounded-md w-24 mt-3" />
        </motion.div>

        {/* Email footer */}
        <motion.div
          className={cn(
            "h-10 bg-gray-100 flex items-center justify-center border-t transition-all cursor-pointer",
            section === 'footer' ? "ring-2 ring-accent ring-inset" : ""
          )}
          onClick={() => setSection('footer')}
        >
          <span className="text-xs text-gray-400">© 2024 Brand Inc.</span>
        </motion.div>
      </div>

      {/* Section info */}
      <div className="text-center">
        <span className="text-sm font-medium text-foreground capitalize">{section}</span>
        <p className="text-xs text-muted-foreground mt-1">
          {section === 'header' && 'Customize logo, colors, and navigation'}
          {section === 'body' && 'Edit content, images, and call-to-actions'}
          {section === 'footer' && 'Configure social links and legal text'}
        </p>
      </div>

      {/* Section selector */}
      <div className="flex justify-center gap-2">
        {(['header', 'body', 'footer'] as const).map((s) => (
          <motion.button
            key={s}
            onClick={() => setSection(s)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm capitalize transition-all",
              section === s 
                ? "bg-accent text-accent-foreground" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {s}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
