import { cn } from "@/lib/utils";

interface BgGradientProps {
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientSize?: string;
  gradientPosition?: string;
  gradientStop?: string;
}

export const BgGradient = ({ 
  className,
  gradientFrom = "hsl(var(--primary))",
  gradientTo = "hsl(var(--background))",
  gradientSize = "125% 125%",
  gradientPosition = "50% 10%",
  gradientStop = "40%"
}: BgGradientProps) => {
  return (
    <div 
      className={cn("fixed inset-0 -z-10 pointer-events-none", className)}
      style={{
        background: `radial-gradient(${gradientSize} at ${gradientPosition}, ${gradientFrom} 0%, ${gradientTo} ${gradientStop})`,
      }}
    />
  );
};

export default BgGradient;
