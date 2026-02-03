import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Smooth card animation variants
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  hover: {
    y: -4,
    scale: 1.02,
  },
  tap: {
    scale: 0.98,
  },
};

const cardTransition = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 15,
  mass: 0.5,
};

const hoverTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 20,
};

// Stagger container variants
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
};

export const staggerTransition = {
  staggerChildren: 0.08,
  delayChildren: 0.1,
};

// Fade slide variants for sections
export const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

export const sectionTransition = {
  type: 'spring' as const,
  stiffness: 80,
  damping: 20,
  mass: 0.8,
};

// Smooth blur-in variant
export const blurVariants = {
  hidden: {
    opacity: 0,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
  },
};

export const blurTransition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

// Scale-in from center
export const scaleVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
  },
};

interface MotionCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  enableHover?: boolean;
  enableTap?: boolean;
  delay?: number;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, enableHover = true, enableTap = true, delay = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('will-change-transform', className)}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        whileHover={enableHover ? 'hover' : undefined}
        whileTap={enableTap ? 'tap' : undefined}
        viewport={{ once: true, margin: '-50px' as any }}
        transition={{ ...cardTransition, delay }}
        {...props}
      />
    );
  }
);
MotionCard.displayName = 'MotionCard';

interface MotionContainerProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {}

export const MotionContainer = forwardRef<HTMLDivElement, MotionContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-30px' as any }}
        transition={staggerTransition}
        {...props}
      />
    );
  }
);
MotionContainer.displayName = 'MotionContainer';

interface MotionSectionProps extends Omit<HTMLMotionProps<'section'>, 'ref'> {
  delay?: number;
}

export const MotionSection = forwardRef<HTMLElement, MotionSectionProps>(
  ({ className, delay = 0, ...props }, ref) => {
    return (
      <motion.section
        ref={ref}
        className={cn('will-change-transform', className)}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' as any }}
        transition={{ ...sectionTransition, delay }}
        {...props}
      />
    );
  }
);
MotionSection.displayName = 'MotionSection';

// Smooth list item for grids
interface MotionItemProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  index?: number;
}

export const MotionItem = forwardRef<HTMLDivElement, MotionItemProps>(
  ({ className, index = 0, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('will-change-transform', className)}
        variants={cardVariants}
        custom={index}
        {...props}
      />
    );
  }
);
MotionItem.displayName = 'MotionItem';

// Page transition wrapper
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};
