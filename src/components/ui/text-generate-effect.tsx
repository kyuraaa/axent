"use client";
import { useEffect, useMemo } from "react";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = false,
  duration = 0.4,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) => {
  const [scope, animate] = useAnimate();
  const isInView = useInView(scope, { once: true });
  
  // Memoize words array to prevent unnecessary re-renders
  const wordsArray = useMemo(() => words.split(" "), [words]);
  
  useEffect(() => {
    if (isInView) {
      animate(
        "span",
        {
          opacity: 1,
          filter: filter ? "blur(0px)" : "none",
          y: 0,
        },
        {
          duration: duration,
          delay: stagger(0.03), // Faster stagger for smoother effect
          ease: [0.25, 0.4, 0.25, 1], // Smooth cubic bezier
        }
      );
    }
  }, [isInView, animate, filter, duration]);

  const renderWords = () => {
    return (
      <motion.div ref={scope} className="inline">
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              className="inline-block opacity-0"
              style={{
                filter: filter ? "blur(4px)" : "none",
                y: 8,
              }}
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className={cn("font-space-grotesk", className)}>
      <div className="text-inherit leading-relaxed">
        {renderWords()}
      </div>
    </div>
  );
};
