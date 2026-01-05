import { useAppSettings } from '@/contexts/AppSettingsContext';

export const HeroBackground = () => {
  const { settings } = useAppSettings();
  const { heroBackground } = settings;

  const getAnimationDuration = () => {
    switch (heroBackground.animationSpeed) {
      case 'slow': return '20s';
      case 'fast': return '5s';
      default: return '10s';
    }
  };

  // Image background
  if (heroBackground.type === 'image' && heroBackground.image) {
    return (
      <div className="absolute inset-0">
        <img
          src={heroBackground.image}
          alt="Hero background"
          className="w-full h-full object-cover"
        />
        {heroBackground.overlay && (
          <div 
            className="absolute inset-0 bg-background"
            style={{ opacity: heroBackground.overlayOpacity }}
          />
        )}
      </div>
    );
  }

  // Animated gradient background
  if (heroBackground.type === 'animated-gradient') {
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
  if (heroBackground.type === 'animated-particles') {
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

  // Default gradient background
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
    </div>
  );
};
