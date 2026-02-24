import { cn } from "@/lib/utils";

interface BackgroundGradientGlowProps {
  className?: string;
}

export const BackgroundGradientGlow = ({ className }: BackgroundGradientGlowProps) => {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
      {/* Top left glow - emerald/primary with drift animation */}
      <div 
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[120px]"
        style={{
          animation: 'drift1 20s ease-in-out infinite',
        }}
      />
      
      {/* Top right glow - subtle white with drift */}
      <div 
        className="absolute -top-20 -right-40 w-[400px] h-[400px] rounded-full bg-white/3 blur-[100px]"
        style={{
          animation: 'drift2 25s ease-in-out infinite',
        }}
      />
      
      {/* Bottom left glow - primary green with drift */}
      <div 
        className="absolute -bottom-40 -left-20 w-[450px] h-[450px] rounded-full bg-emerald-600/6 blur-[130px]"
        style={{
          animation: 'drift3 22s ease-in-out infinite',
        }}
      />
      
      {/* Bottom right glow - green accent with drift */}
      <div 
        className="absolute -bottom-60 -right-40 w-[500px] h-[500px] rounded-full bg-green-500/5 blur-[140px]"
        style={{
          animation: 'drift4 28s ease-in-out infinite',
        }}
      />
      
      {/* Center subtle glow with slow pulse */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/4 blur-[150px]"
        style={{
          animation: 'pulse-slow 15s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, 20px); }
          50% { transform: translate(-20px, 40px); }
          75% { transform: translate(40px, -10px); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-40px, 30px); }
          50% { transform: translate(20px, -20px); }
          75% { transform: translate(-30px, -40px); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -30px); }
          50% { transform: translate(50px, 20px); }
          75% { transform: translate(-20px, 30px); }
        }
        @keyframes drift4 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-30px, -20px); }
          50% { transform: translate(40px, 30px); }
          75% { transform: translate(20px, -40px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default BackgroundGradientGlow;