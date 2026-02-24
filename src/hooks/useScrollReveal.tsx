import { useInView, type Variants } from 'framer-motion';
import { useRef } from 'react';

// Optimized animation variants with reduced offset for smoother performance
export const revealVariants: Record<string, Variants> = {
  fadeUp: {
    hidden: { 
      opacity: 0, 
      y: 30,
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  },
  scaleIn: {
    hidden: { 
      opacity: 0, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  },
  slideLeft: {
    hidden: { 
      opacity: 0, 
      x: -30 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  },
  slideRight: {
    hidden: { 
      opacity: 0, 
      x: 30 
    },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  }
};

// Bidirectional variants - animate both in and out on scroll
export const scrollRevealVariants: Record<string, Variants> = {
  fadeUp: {
    hidden: { 
      opacity: 0, 
      y: 40,
      transition: { 
        duration: 0.4, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  },
  fadeDown: {
    hidden: { 
      opacity: 0, 
      y: -40,
      transition: { 
        duration: 0.4, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  },
  scaleIn: {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      transition: { 
        duration: 0.3, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4, 
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const scrollStaggerContainer: Variants = {
  hidden: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

export const dramaticStagger: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

export const useScrollReveal = (threshold = 0.1) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  
  return { ref, isInView };
};
