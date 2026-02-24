import React from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Target, 
  RefreshCw, 
  CreditCard, 
  TrendingUp, 
  Receipt, 
  FileText, 
  Banknote, 
  Calculator, 
  Settings, 
  BrainCircuit, 
  Sparkles, 
  ScanLine, 
  Wallet, 
  LineChart, 
  DollarSign,
  Construction
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: string;
}

const iconMap: Record<string, React.ElementType> = {
  'pie-chart': PieChart,
  'target': Target,
  'refresh': RefreshCw,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  'receipt': Receipt,
  'file-text': FileText,
  'banknote': Banknote,
  'calculator': Calculator,
  'settings': Settings,
  'brain': BrainCircuit,
  'sparkles': Sparkles,
  'scan': ScanLine,
  'wallet': Wallet,
  'line-chart': LineChart,
  'dollar': DollarSign,
};

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, icon }) => {
  const Icon = iconMap[icon] || Construction;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-md w-full"
      >
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
            >
              <Icon className="w-10 h-10 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">{title}</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <Construction className="w-4 h-4" />
              <span>Fitur ini sedang dalam pengembangan</span>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">
                Tim kami sedang bekerja keras untuk menghadirkan fitur ini. 
                Nantikan update terbaru dari Axent!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PlaceholderPage;
