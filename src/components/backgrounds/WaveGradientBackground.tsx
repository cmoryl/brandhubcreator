import { useEffect, useRef, memo } from 'react';

interface WaveGradientBackgroundProps {
  variant?: 'default' | 'subtle' | 'bold' | 'dark';
  speed?: 'slow' | 'medium' | 'fast';
  className?: string;
}

const WAVE_CONFIGS = {
  default: {
    colors: [
      'hsla(var(--primary), 0.15)',
      'hsla(var(--accent), 0.12)',
      'hsla(var(--secondary), 0.1)',
    ],
    lineOpacity: 0.3,
  },
  subtle: {
    colors: [
      'hsla(var(--primary), 0.08)',
      'hsla(var(--accent), 0.06)',
      'hsla(var(--muted), 0.05)',
    ],
    lineOpacity: 0.15,
  },
  bold: {
    colors: [
      'hsla(var(--primary), 0.25)',
      'hsla(var(--accent), 0.2)',
      'hsla(var(--secondary), 0.15)',
    ],
    lineOpacity: 0.5,
  },
  dark: {
    colors: [
      'hsla(220, 60%, 20%, 0.3)',
      'hsla(260, 60%, 25%, 0.25)',
      'hsla(200, 50%, 15%, 0.2)',
    ],
    lineOpacity: 0.4,
  },
};

const SPEED_MAP = {
  slow: 0.0003,
  medium: 0.0006,
  fast: 0.001,
};

export const WaveGradientBackground = memo(function WaveGradientBackground({
  variant = 'default',
  speed = 'medium',
  className = '',
}: WaveGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = WAVE_CONFIGS[variant];
    const speedMultiplier = SPEED_MAP[speed];

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Wave parameters
    const waves = [
      { amplitude: 80, frequency: 0.003, phase: 0, yOffset: 0.3 },
      { amplitude: 60, frequency: 0.004, phase: Math.PI / 3, yOffset: 0.5 },
      { amplitude: 100, frequency: 0.002, phase: Math.PI / 2, yOffset: 0.7 },
      { amplitude: 40, frequency: 0.005, phase: Math.PI, yOffset: 0.4 },
      { amplitude: 70, frequency: 0.0025, phase: Math.PI * 1.5, yOffset: 0.6 },
    ];

    const drawWave = (
      wave: typeof waves[0],
      color: string,
      lineWidth: number,
      time: number
    ) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      for (let x = 0; x <= width; x += 3) {
        const y =
          height * wave.yOffset +
          Math.sin(x * wave.frequency + time + wave.phase) * wave.amplitude +
          Math.sin(x * wave.frequency * 0.5 + time * 0.7) * (wave.amplitude * 0.3);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    };

    const drawGradientBlob = (
      x: number,
      y: number,
      radius: number,
      color: string,
      time: number
    ) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.fillStyle = gradient;
      
      // Organic blob shape using noise-like distortion
      const points = 60;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const distortion = 
          Math.sin(angle * 3 + time) * 0.15 +
          Math.sin(angle * 5 + time * 1.3) * 0.1 +
          Math.sin(angle * 7 + time * 0.7) * 0.05;
        const r = radius * (1 + distortion);
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      
      ctx.closePath();
      ctx.fill();
    };

    const animate = (timestamp: number) => {
      timeRef.current = timestamp * speedMultiplier;
      const time = timeRef.current;
      const rect = canvas.getBoundingClientRect();

      ctx.clearRect(0, 0, rect.width, rect.height);

      // Draw gradient blobs
      const blobPositions = [
        { x: rect.width * 0.2, y: rect.height * 0.3, radius: 300 },
        { x: rect.width * 0.8, y: rect.height * 0.6, radius: 250 },
        { x: rect.width * 0.5, y: rect.height * 0.8, radius: 350 },
      ];

      blobPositions.forEach((blob, i) => {
        const offsetX = Math.sin(time + i * 2) * 50;
        const offsetY = Math.cos(time * 0.8 + i * 1.5) * 30;
        drawGradientBlob(
          blob.x + offsetX,
          blob.y + offsetY,
          blob.radius,
          config.colors[i % config.colors.length],
          time
        );
      });

      // Draw flowing wave lines
      waves.forEach((wave, i) => {
        const color = `hsla(var(--primary), ${config.lineOpacity * (1 - i * 0.15)})`;
        const lineWidth = 2 - i * 0.3;
        drawWave(wave, color, Math.max(lineWidth, 0.5), time);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [variant, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ mixBlendMode: 'normal' }}
    />
  );
});

// CSS-only fallback for reduced motion preference
export const WaveGradientBackgroundCSS = memo(function WaveGradientBackgroundCSS({
  variant = 'default',
  className = '',
}: Omit<WaveGradientBackgroundProps, 'speed'>) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ isolation: 'isolate' }}
    >
      {/* Gradient blobs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20 animate-[float_20s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)',
          top: '10%',
          left: '10%',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-15 animate-[float_25s_ease-in-out_infinite_reverse]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)',
          top: '40%',
          right: '10%',
          animationDelay: '-5s',
        }}
      />
      <div
        className="absolute w-[700px] h-[700px] rounded-full blur-3xl opacity-10 animate-[float_30s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--secondary)) 0%, transparent 70%)',
          bottom: '0%',
          left: '30%',
          animationDelay: '-10s',
        }}
      />

      {/* SVG wave lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 1440 800"
      >
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path
          d="M0,400 Q360,300 720,400 T1440,400"
          fill="none"
          stroke="url(#wave-gradient-1)"
          strokeWidth="2"
          className="animate-[wave-flow_8s_ease-in-out_infinite]"
        />
        <path
          d="M0,500 Q360,600 720,500 T1440,500"
          fill="none"
          stroke="url(#wave-gradient-2)"
          strokeWidth="1.5"
          className="animate-[wave-flow_12s_ease-in-out_infinite_reverse]"
        />
        <path
          d="M0,300 Q360,200 720,300 T1440,300"
          fill="none"
          stroke="url(#wave-gradient-1)"
          strokeWidth="1"
          className="animate-[wave-flow_10s_ease-in-out_infinite]"
          style={{ animationDelay: '-3s' }}
        />
      </svg>
    </div>
  );
});

export default WaveGradientBackground;
