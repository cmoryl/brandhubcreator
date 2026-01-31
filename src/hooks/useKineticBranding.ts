/**
 * useKineticBranding - Micro-Animation Engine
 * 
 * Applies "Brand Physics" to icons:
 * - Entrance animations (fade, pop, draw)
 * - Interactive physics (wiggle, bounce)
 * - Lottie-compatible animation data export
 */

import { useMemo, useCallback } from 'react';

export type BrandPersonality = 'professional' | 'friendly' | 'playful' | 'luxury' | 'tech';
export type EntranceAnimation = 'fade' | 'pop' | 'draw' | 'bounce' | 'slide' | 'scale' | 'none';
export type InteractionAnimation = 'wiggle' | 'pulse' | 'bounce' | 'spin' | 'shake' | 'none';

export interface PhysicsConfig {
  mass: number;       // Affects inertia (0.1 - 2)
  tension: number;    // Spring tightness (100 - 500)
  friction: number;   // Damping (10 - 50)
  elasticity: number; // Bounce factor (0 - 1)
}

export interface AnimationPreset {
  entrance: EntranceAnimation;
  interaction: InteractionAnimation;
  physics: PhysicsConfig;
  duration: number;
  delay: number;
  easing: string;
}

export interface KineticIconData {
  svg: string;
  css: string;
  keyframes: Record<string, Record<string, string>>;
  lottieData?: object;
}

// Brand personality → Physics mapping
const PERSONALITY_PHYSICS: Record<BrandPersonality, PhysicsConfig> = {
  professional: {
    mass: 1.2,
    tension: 400,
    friction: 40,
    elasticity: 0.1,
  },
  friendly: {
    mass: 0.8,
    tension: 250,
    friction: 20,
    elasticity: 0.4,
  },
  playful: {
    mass: 0.5,
    tension: 150,
    friction: 10,
    elasticity: 0.8,
  },
  luxury: {
    mass: 1.5,
    tension: 300,
    friction: 45,
    elasticity: 0.05,
  },
  tech: {
    mass: 0.7,
    tension: 350,
    friction: 25,
    elasticity: 0.3,
  },
};

// Animation presets by personality
const PERSONALITY_PRESETS: Record<BrandPersonality, AnimationPreset> = {
  professional: {
    entrance: 'fade',
    interaction: 'pulse',
    physics: PERSONALITY_PHYSICS.professional,
    duration: 300,
    delay: 0,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  friendly: {
    entrance: 'pop',
    interaction: 'bounce',
    physics: PERSONALITY_PHYSICS.friendly,
    duration: 400,
    delay: 50,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  playful: {
    entrance: 'bounce',
    interaction: 'wiggle',
    physics: PERSONALITY_PHYSICS.playful,
    duration: 500,
    delay: 100,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  luxury: {
    entrance: 'scale',
    interaction: 'none',
    physics: PERSONALITY_PHYSICS.luxury,
    duration: 600,
    delay: 0,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  tech: {
    entrance: 'draw',
    interaction: 'pulse',
    physics: PERSONALITY_PHYSICS.tech,
    duration: 350,
    delay: 25,
    easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  },
};

// CSS keyframes for each animation type
const ANIMATION_KEYFRAMES: Record<string, Record<string, string>> = {
  fade: {
    '0%': 'opacity: 0; transform: translateY(4px);',
    '100%': 'opacity: 1; transform: translateY(0);',
  },
  pop: {
    '0%': 'opacity: 0; transform: scale(0.5);',
    '60%': 'opacity: 1; transform: scale(1.1);',
    '100%': 'opacity: 1; transform: scale(1);',
  },
  bounce: {
    '0%': 'opacity: 0; transform: translateY(-20px);',
    '50%': 'opacity: 1; transform: translateY(4px);',
    '70%': 'transform: translateY(-2px);',
    '100%': 'transform: translateY(0);',
  },
  scale: {
    '0%': 'opacity: 0; transform: scale(0.8);',
    '100%': 'opacity: 1; transform: scale(1);',
  },
  slide: {
    '0%': 'opacity: 0; transform: translateX(-10px);',
    '100%': 'opacity: 1; transform: translateX(0);',
  },
  draw: {
    '0%': 'stroke-dashoffset: 100;',
    '100%': 'stroke-dashoffset: 0;',
  },
  wiggle: {
    '0%, 100%': 'transform: rotate(0deg);',
    '25%': 'transform: rotate(-3deg);',
    '75%': 'transform: rotate(3deg);',
  },
  pulse: {
    '0%, 100%': 'transform: scale(1);',
    '50%': 'transform: scale(1.05);',
  },
  spin: {
    '0%': 'transform: rotate(0deg);',
    '100%': 'transform: rotate(360deg);',
  },
  shake: {
    '0%, 100%': 'transform: translateX(0);',
    '10%, 30%, 50%, 70%, 90%': 'transform: translateX(-2px);',
    '20%, 40%, 60%, 80%': 'transform: translateX(2px);',
  },
};

export function useKineticBranding(personality: BrandPersonality = 'professional') {
  const preset = useMemo(() => PERSONALITY_PRESETS[personality], [personality]);
  const physics = useMemo(() => PERSONALITY_PHYSICS[personality], [personality]);

  /**
   * Generate CSS animation for an entrance effect
   */
  const generateEntranceCSS = useCallback((
    animationType: EntranceAnimation,
    duration?: number,
    delay?: number,
    easing?: string
  ): string => {
    if (animationType === 'none') return '';

    const keyframes = ANIMATION_KEYFRAMES[animationType];
    const animName = `icon-entrance-${animationType}`;
    const dur = duration ?? preset.duration;
    const del = delay ?? preset.delay;
    const ease = easing ?? preset.easing;

    const keyframeCSS = Object.entries(keyframes)
      .map(([key, value]) => `  ${key} { ${value} }`)
      .join('\n');

    return `
@keyframes ${animName} {
${keyframeCSS}
}

.icon-animated-${animationType} {
  animation: ${animName} ${dur}ms ${ease} ${del}ms forwards;
}
`;
  }, [preset]);

  /**
   * Generate CSS for interaction animation
   */
  const generateInteractionCSS = useCallback((
    animationType: InteractionAnimation,
    trigger: 'hover' | 'click' | 'focus' = 'hover'
  ): string => {
    if (animationType === 'none') return '';

    const keyframes = ANIMATION_KEYFRAMES[animationType];
    const animName = `icon-interact-${animationType}`;

    const keyframeCSS = Object.entries(keyframes)
      .map(([key, value]) => `  ${key} { ${value} }`)
      .join('\n');

    const triggerSelector = trigger === 'hover' 
      ? ':hover' 
      : trigger === 'click' 
        ? ':active' 
        : ':focus';

    return `
@keyframes ${animName} {
${keyframeCSS}
}

.icon-interactive${triggerSelector} {
  animation: ${animName} ${preset.duration}ms ${preset.easing} infinite;
}
`;
  }, [preset]);

  /**
   * Add kinetic animations to an SVG
   */
  const applyKineticAnimation = useCallback((
    svg: string,
    entrance: EntranceAnimation = preset.entrance,
    interaction: InteractionAnimation = preset.interaction
  ): KineticIconData => {
    // Add classes for animation
    let processed = svg.replace(
      '<svg',
      `<svg class="icon-kinetic icon-animated-${entrance} icon-interactive"`
    );

    // For draw animation, add stroke-dasharray
    if (entrance === 'draw') {
      processed = processed.replace(
        '<path',
        '<path stroke-dasharray="100" stroke-dashoffset="100"'
      );
    }

    // Generate combined CSS
    const entranceCSS = generateEntranceCSS(entrance);
    const interactionCSS = generateInteractionCSS(interaction);

    const css = `
/* Icon Kinetic Animation - ${personality} personality */
.icon-kinetic {
  will-change: transform, opacity;
  transform-origin: center;
}

${entranceCSS}
${interactionCSS}
`;

    return {
      svg: processed,
      css,
      keyframes: {
        entrance: ANIMATION_KEYFRAMES[entrance] || {},
        interaction: ANIMATION_KEYFRAMES[interaction] || {},
      },
    };
  }, [preset, personality, generateEntranceCSS, generateInteractionCSS]);

  /**
   * Generate a Lottie-compatible animation data object
   * (Simplified structure - production would need full Lottie spec)
   */
  const generateLottieData = useCallback((
    svg: string,
    entrance: EntranceAnimation = preset.entrance
  ): object => {
    // Extract viewBox dimensions
    const viewBoxMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    const width = viewBoxMatch ? parseInt(viewBoxMatch[1]) : 24;
    const height = viewBoxMatch ? parseInt(viewBoxMatch[2]) : 24;

    // Basic Lottie structure
    const lottieData = {
      v: '5.9.6',
      fr: 60,
      ip: 0,
      op: Math.round(preset.duration / (1000 / 60)),
      w: width,
      h: height,
      nm: 'Icon Animation',
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4, // Shape layer
          nm: 'Icon',
          sr: 1,
          ks: {
            o: { a: entrance !== 'none' ? 1 : 0, k: entrance !== 'none' ? [
              { t: 0, s: [0], e: [100] },
              { t: Math.round(preset.duration / (1000 / 60)), s: [100] }
            ] : 100 },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [width / 2, height / 2, 0] },
            a: { a: 0, k: [width / 2, height / 2, 0] },
            s: { a: entrance === 'pop' || entrance === 'scale' ? 1 : 0, k: entrance === 'pop' || entrance === 'scale' ? [
              { t: 0, s: [50, 50, 100], e: [100, 100, 100] },
              { t: Math.round(preset.duration / (1000 / 60)), s: [100, 100, 100] }
            ] : [100, 100, 100] },
          },
          ao: 0,
          ip: 0,
          op: Math.round(preset.duration / (1000 / 60)),
          st: 0,
        }
      ],
      markers: [],
      meta: {
        generator: 'Brand Icon Studio',
        personality,
        entrance,
      },
    };

    return lottieData;
  }, [preset, personality]);

  /**
   * Generate staggered animation for a set of icons
   */
  const generateStaggeredCSS = useCallback((
    count: number,
    baseDelay: number = 50,
    entrance: EntranceAnimation = preset.entrance
  ): string => {
    const rules = Array.from({ length: count }, (_, i) => 
      `.icon-stagger:nth-child(${i + 1}) { animation-delay: ${i * baseDelay}ms; }`
    ).join('\n');

    return `
${generateEntranceCSS(entrance)}

.icon-stagger {
  opacity: 0;
  animation-fill-mode: forwards;
}

${rules}
`;
  }, [preset, generateEntranceCSS]);

  return {
    // Current preset
    preset,
    physics,
    
    // Generators
    applyKineticAnimation,
    generateEntranceCSS,
    generateInteractionCSS,
    generateLottieData,
    generateStaggeredCSS,
    
    // Reference data
    allPresets: PERSONALITY_PRESETS,
    allPhysics: PERSONALITY_PHYSICS,
    keyframes: ANIMATION_KEYFRAMES,
    
    // Available options
    entranceOptions: ['fade', 'pop', 'draw', 'bounce', 'slide', 'scale', 'none'] as EntranceAnimation[],
    interactionOptions: ['wiggle', 'pulse', 'bounce', 'spin', 'shake', 'none'] as InteractionAnimation[],
    personalityOptions: ['professional', 'friendly', 'playful', 'luxury', 'tech'] as BrandPersonality[],
  };
}

export default useKineticBranding;
