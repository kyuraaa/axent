import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  ArrowUpIcon, ArrowDownIcon, TrendingUp, Bitcoin, Briefcase,
  ShoppingCart, Home, Car, Utensils, Heart, PartyPopper, Shirt,
  Banknote, PiggyBank, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  transaction_type: 'income' | 'expense';
}

interface Investment {
  id: string;
  name: string;
  type: string;
  amount: number;
  current_value: number;
  purchase_date: string;
}

interface CryptoHolding {
  id: string;
  coin_name: string;
  symbol: string;
  amount: number;
  purchase_price: number;
  purchase_date: string;
}

interface BusinessTransaction {
  id: string;
  business_name: string;
  category: string;
  amount: number;
  transaction_type: string;
  transaction_date: string;
  description: string | null;
}

interface RecentActivityProps {
  transactions: Transaction[];
  investments: Investment[];
  cryptoHoldings: CryptoHolding[];
  businessTransactions: BusinessTransaction[];
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ElementType> = {
    salary: Banknote,
    bonus: Star,
    investment: PiggyBank,
    other_income: Star,
    food: Utensils,
    transport: Car,
    shopping: ShoppingCart,
    bills: Home,
    entertainment: PartyPopper,
    health: Heart,
    clothing: Shirt,
    other: ShoppingCart
  };
  return icons[category] || ShoppingCart;
};

const RecentActivity = ({ 
  transactions, 
  investments, 
  cryptoHoldings, 
  businessTransactions 
}: RecentActivityProps) => {
  // Combine and sort all activities
  const activities = [
    ...transactions.map(t => ({
      id: t.id,
      type: 'transaction' as const,
      title: t.description,
      subtitle: t.category,
      amount: t.amount,
      isPositive: t.transaction_type === 'income',
      date: new Date(t.date),
      icon: t.transaction_type === 'income' ? ArrowUpIcon : getCategoryIcon(t.category),
      category: t.category
    })),
    ...investments.map(i => ({
      id: i.id,
      type: 'investment' as const,
      title: i.name,
      subtitle: i.type === 'stock' ? 'Saham' : 'Investasi',
      amount: i.amount,
      isPositive: true,
      date: new Date(i.purchase_date),
      icon: TrendingUp,
      category: 'investment'
    })),
    ...cryptoHoldings.map(c => ({
      id: c.id,
      type: 'crypto' as const,
      title: c.coin_name,
      subtitle: `${c.amount} ${c.symbol}`,
      amount: c.purchase_price * c.amount,
      isPositive: true,
      date: new Date(c.purchase_date),
      icon: Bitcoin,
      category: 'crypto'
    })),
    ...businessTransactions.map(b => ({
      id: b.id,
      type: 'business' as const,
      title: b.description || b.business_name,
      subtitle: b.category,
      amount: b.amount,
      isPositive: b.transaction_type === 'pemasukan',
      date: new Date(b.transaction_date),
      icon: Briefcase,
      category: 'business'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);

  const getActivityColor = (type: string, isPositive: boolean) => {
    if (type === 'crypto') return 'bg-emerald-500/20 text-emerald-400';
    if (type === 'investment') return 'bg-green-500/20 text-green-400';
    if (type === 'business') return 'bg-emerald-500/20 text-emerald-400';
    return isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/70';
  };

  if (activities.length === 0) {
    return (
      <Card className="border-white/10 backdrop-blur-xl bg-white/5 p-6">
        <h3 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h3>
        <div className="flex flex-col items-center justify-center py-8 text-white/50">
          <ShoppingCart size={40} className="mb-3 opacity-50" />
          <p>Belum ada aktivitas</p>
          <p className="text-sm">Mulai dengan menambah transaksi pertama Anda</p>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <Card className="border-white/10 backdrop-blur-xl bg-white/5 p-6 h-full">
        <h3 className="text-lg font-semibold mb-4">Aktivitas Terbaru</h3>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const IconComponent = activity.icon;
            return (
              <motion.div
                key={`${activity.type}-${activity.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className={cn("p-2 rounded-lg", getActivityColor(activity.type, activity.isPositive))}>
                  <IconComponent size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-white/50 truncate">{activity.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-medium tabular-nums",
                    activity.isPositive ? "text-emerald-400" : "text-white/70"
                  )}>
                    {activity.isPositive ? '+' : '-'}{formatRupiah(activity.amount)}
                  </p>
                  <p className="text-xs text-white/40">
                    {format(activity.date, 'd MMM', { locale: id })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
};

export default RecentActivity;