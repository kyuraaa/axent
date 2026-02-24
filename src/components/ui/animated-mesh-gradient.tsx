"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedMeshGradientProps {
  className?: string;
  children?: React.ReactNode;
}

export function AnimatedMeshGradient({ className, children }: AnimatedMeshGradientProps) {
  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-black", className)}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <motion.div 
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full mix-blend-normal filter blur-[128px]"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -30, 50, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-green-500/15 rounded-full mix-blend-normal filter blur-[128px]"
          animate={{
            x: [0, -40, 60, 0],
            y: [0, 40, -20, 0],
            scale: [1, 0.95, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div 
          className="absolute top-1/4 right-1/3 w-[400px] h-[400px] bg-emerald-400/10 rounded-full mix-blend-normal filter blur-[96px]"
          animate={{
            x: [0, 30, -50, 0],
            y: [0, 50, 20, 0],
            scale: [1, 1.05, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 left-1/3 w-[450px] h-[450px] bg-emerald-500/8 rounded-full mix-blend-normal filter blur-[100px]"
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 20, -40, 0],
            scale: [1, 0.9, 1.08, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 6,
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-[350px] h-[350px] bg-green-500/8 rounded-full mix-blend-normal filter blur-[80px]"
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}