import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, ScanLine, MessageSquare, TrendingUp, Briefcase } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

// Animated icon wrapper for consistent hover effects
const AnimatedIcon = ({ icon: Icon, size = 16 }: { icon: React.ElementType; size?: number }) => (
  <motion.div
    whileHover={{ scale: 1.2, rotate: 8 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    className="flex-shrink-0"
  >
    <Icon size={size} strokeWidth={1.5} />
  </motion.div>
);

const QuickActions = () => {
  const [, setSearchParams] = useSearchParams();

  const actions = [
    {
      label: 'Tambah Transaksi',
      icon: Plus,
      onClick: () => setSearchParams({ tab: 'budget' }),
    },
    {
      label: 'Scan Struk',
      icon: ScanLine,
      onClick: () => setSearchParams({ tab: 'budget' }),
    },
    {
      label: 'Tanya AI',
      icon: MessageSquare,
      onClick: () => setSearchParams({ tab: 'advisor' }),
    },
    {
      label: 'Log Investasi',
      icon: TrendingUp,
      onClick: () => setSearchParams({ tab: 'investments' }),
    },
    {
      label: 'Transaksi Bisnis',
      icon: Briefcase,
      onClick: () => setSearchParams({ tab: 'business' }),
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="glass-card p-4"
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Aksi Cepat</h3>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + index * 0.05 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              onClick={action.onClick}
              className="border-border/50 bg-card/50 hover:bg-accent/50 hover:border-primary/30 gap-2 text-sm transition-all duration-200"
            >
              <AnimatedIcon icon={action.icon} size={16} />
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden">{action.label.split(' ')[0]}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickActions;
