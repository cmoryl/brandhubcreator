import { useAppSettings, HeroBackgroundType } from '@/contexts/AppSettingsContext';

interface HeroBackgroundProps {
  type?: HeroBackgroundType;
  image?: string;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  overlay?: boolean;
  overlayOpacity?: number;
}

export const HeroBackground = ({ 
  type: propType, 
  image: propImage, 
  animationSpeed: propSpeed,
  overlay: propOverlay,
  overlayOpacity: propOpacity 
}: HeroBackgroundProps = {}) => {
  const { settings } = useAppSettings();
  const { heroBackground } = settings;

  // Use props if provided, otherwise fall back to app settings
  const type = propType || heroBackground.type;
  const image = propImage || heroBackground.image;
  const animationSpeed = propSpeed || heroBackground.animationSpeed;
  const overlay = propOverlay ?? heroBackground.overlay;
  const overlayOpacity = propOpacity ?? heroBackground.overlayOpacity;

  const getAnimationDuration = () => {
    switch (animationSpeed) {
      case 'slow': return '20s';
      case 'fast': return '5s';
      default: return '10s';
    }
  };

  // Image background
  if (type === 'image' && image) {
    return (
      <div className="absolute inset-0">
        <img
          src={image}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        {overlay && (
          <div 
            className="absolute inset-0 bg-background"
            style={{ opacity: overlayOpacity }}
          />
        )}
      </div>
    );
  }

  // Animated gradient background
  if (type === 'animated-gradient') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-accent/20 via-primary/10 to-accent/20"
          style={{
            backgroundSize: '400% 400%',
            animation: `gradientShift ${getAnimationDuration()} ease infinite`,
          }}
        />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        <div 
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
          style={{ animation: `pulse ${getAnimationDuration()} ease-in-out infinite` }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          style={{ animation: `pulse ${getAnimationDuration()} ease-in-out infinite reverse` }}
        />
        <style>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    );
  }

  // Animated particles background
  if (type === 'animated-particles') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-accent/20"
            style={{
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(40px)',
              animation: `float${i % 3} ${parseFloat(getAnimationDuration()) + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes float0 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -30px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-40px, 20px) scale(0.9); }
            66% { transform: translate(20px, -40px) scale(1.1); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(25px, 25px) scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  // Animated waves background
  if (type === 'animated-waves') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-[200%] h-40 left-[-50%]"
            style={{
              bottom: `${i * 15}%`,
              background: `linear-gradient(to right, transparent, hsl(var(--accent) / ${0.05 + i * 0.02}), transparent)`,
              borderRadius: '100%',
              animation: `wave ${parseFloat(getAnimationDuration()) + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
        <style>{`
          @keyframes wave {
            0%, 100% { transform: translateX(-5%) translateY(0) rotate(-2deg); }
            50% { transform: translateX(5%) translateY(-20px) rotate(2deg); }
          }
        `}</style>
      </div>
    );
  }

  // Animated mesh gradient background
  if (type === 'animated-mesh') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, hsl(var(--accent) / 0.15) 0px, transparent 50%),
              radial-gradient(at 100% 0%, hsl(var(--primary) / 0.1) 0px, transparent 50%),
              radial-gradient(at 100% 100%, hsl(var(--accent) / 0.12) 0px, transparent 50%),
              radial-gradient(at 0% 100%, hsl(var(--primary) / 0.08) 0px, transparent 50%)
            `,
            animation: `meshMove ${getAnimationDuration()} ease-in-out infinite`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 50% 50%, hsl(var(--accent) / 0.1) 0px, transparent 40%)
            `,
            animation: `meshPulse ${getAnimationDuration()} ease-in-out infinite`,
          }}
        />
        <style>{`
          @keyframes meshMove {
            0%, 100% { transform: scale(1) rotate(0deg); }
            33% { transform: scale(1.05) rotate(1deg); }
            66% { transform: scale(0.95) rotate(-1deg); }
          }
          @keyframes meshPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  // Animated aurora background
  if (type === 'animated-aurora') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-primary/5" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-[60%] left-0 top-[20%]"
            style={{
              background: `linear-gradient(${90 + i * 30}deg, 
                transparent 20%, 
                hsl(var(--accent) / ${0.08 + i * 0.03}) 40%, 
                hsl(var(--primary) / ${0.06 + i * 0.02}) 60%, 
                transparent 80%
              )`,
              filter: 'blur(60px)',
              animation: `aurora ${parseFloat(getAnimationDuration()) + i * 3}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
              transformOrigin: 'center center',
            }}
          />
        ))}
        <style>{`
          @keyframes aurora {
            0%, 100% { 
              transform: translateX(-10%) scaleY(1) skewX(0deg); 
              opacity: 0.5;
            }
            25% { 
              transform: translateX(5%) scaleY(1.2) skewX(5deg); 
              opacity: 0.8;
            }
            50% { 
              transform: translateX(10%) scaleY(0.9) skewX(-3deg); 
              opacity: 0.6;
            }
            75% { 
              transform: translateX(-5%) scaleY(1.1) skewX(2deg); 
              opacity: 0.7;
            }
          }
        `}</style>
      </div>
    );
  }

  // Animated geometric background
  if (type === 'animated-geometric') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/3 to-background" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="absolute border border-accent/10"
            style={{
              width: `${150 + i * 80}px`,
              height: `${150 + i * 80}px`,
              left: `${20 + (i % 3) * 25}%`,
              top: `${10 + Math.floor(i / 3) * 40}%`,
              borderRadius: i % 2 === 0 ? '20%' : '50%',
              animation: `geometricFloat${i % 2} ${parseFloat(getAnimationDuration()) + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
        <div
          className="absolute w-64 h-64 border-2 border-accent/5 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            animation: `geometricRotate ${parseFloat(getAnimationDuration()) * 2}s linear infinite`,
          }}
        />
        <style>{`
          @keyframes geometricFloat0 {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.3; }
            50% { transform: translateY(-30px) rotate(45deg) scale(1.1); opacity: 0.5; }
          }
          @keyframes geometricFloat1 {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.2; }
            50% { transform: translateY(20px) rotate(-30deg) scale(0.9); opacity: 0.4; }
          }
          @keyframes geometricRotate {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Animated spotlight background
  if (type === 'animated-spotlight') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute w-[150%] h-[150%] -left-[25%] -top-[25%]"
          style={{
            background: `
              radial-gradient(ellipse 40% 60% at 30% 40%, hsl(var(--accent) / 0.15) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 70% 60%, hsl(var(--primary) / 0.1) 0%, transparent 60%)
            `,
            animation: `spotlightMove ${getAnimationDuration()} ease-in-out infinite`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 30% 50% at 50% 50%, hsl(var(--accent) / 0.08) 0%, transparent 70%)`,
            animation: `spotlightPulse ${parseFloat(getAnimationDuration()) / 2}s ease-in-out infinite`,
          }}
        />
        <style>{`
          @keyframes spotlightMove {
            0%, 100% { transform: translate(0%, 0%) rotate(0deg); }
            25% { transform: translate(10%, -5%) rotate(5deg); }
            50% { transform: translate(5%, 10%) rotate(-3deg); }
            75% { transform: translate(-5%, 5%) rotate(2deg); }
          }
          @keyframes spotlightPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
        `}</style>
      </div>
    );
  }

  // Default gradient background
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
    </div>
  );
};