'use client';
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/hooks/use-scroll';
import MegaMenu, { MegaMenuItem } from '@/components/ui/mega-menu';
import {
  LayoutDashboard,
  PieChart,
  TrendingUp,
  BrainCircuit,
  LineChart,
  Briefcase,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Home,
  ChevronDown,
  Wallet,
  Target,
  Receipt,
  CreditCard,
  FileText,
  BarChart3,
  Calculator,
  Building2,
  FileSpreadsheet,
  Banknote,
  Bot,
  Sparkles,
  ScanLine,
  Bell,
  Search,
  ArrowUpDown,
  RefreshCw,
  CircleDollarSign
} from 'lucide-react';
import axentLogo from '@/assets/solid_white_text-removebg-preview.png';

interface DashboardHeaderProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
}

// Navigation structure for mobile
const personalMenu = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'Ringkasan keuangan personal' },
  { id: 'budget', label: 'Transactions', icon: ArrowUpDown, description: 'Pemasukan & pengeluaran' },
  { id: 'budgeting', label: 'Budgeting', icon: PieChart, description: 'Budget per kategori' },
  { id: 'goals', label: 'Goals', icon: Target, description: 'Tabungan & target' },
  { id: 'recurring', label: 'Recurring', icon: RefreshCw, description: 'Tagihan & langganan' },
  { id: 'debts', label: 'Debts', icon: CreditCard, description: 'Utang & cicilan' },
  { id: 'networth', label: 'Net Worth', icon: TrendingUp, description: 'Aset vs liabilitas' },
  { id: 'analytics', label: 'Reports', icon: FileText, description: 'Laporan bulanan/tahunan' },
];

const businessMenu = [
  { id: 'business', label: 'Business Overview', icon: Building2, description: 'Snapshot arus kas bisnis' },
  { id: 'business-transactions', label: 'Transactions', icon: Receipt, description: 'Transaksi bisnis' },
  { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet, description: 'Buat & kelola invoice' },
  { id: 'cashflow', label: 'Cash Flow', icon: Banknote, description: 'Inflow vs outflow' },
  { id: 'business-expenses', label: 'Expenses', icon: Calculator, description: 'Biaya operasional' },
  { id: 'business-reports', label: 'Reports', icon: BarChart3, description: 'Profit & Loss' },
  { id: 'business-settings', label: 'Settings', icon: Settings, description: 'Pengaturan bisnis' },
];

const aiMenu = [
  { id: 'ai-dashboard', label: 'AI Dashboard', icon: LayoutDashboard, description: 'Ringkasan insight AI' },
  { id: 'advisor', label: 'AI Advisor', icon: Bot, description: 'Chat AI keuangan' },
  { id: 'smart-insights', label: 'Smart Insights', icon: Sparkles, description: 'Anomali & warning' },
  { id: 'scanners', label: 'Scanners', icon: ScanLine, description: 'Receipt & portfolio scanner' },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp, description: 'Proyeksi keuangan' },
  { id: 'ai-settings', label: 'AI Settings', icon: Settings, description: 'Kontrol privasi AI' },
];

const investmentMenu = [
  { id: 'investments', label: 'Portfolio Overview', icon: PieChart, description: 'Ringkasan investasi' },
  { id: 'holdings', label: 'Holdings', icon: Wallet, description: 'Saham & crypto' },
  { id: 'performance', label: 'Performance', icon: LineChart, description: 'Performa portfolio' },
  { id: 'dividends', label: 'Dividends', icon: CircleDollarSign, description: 'Dividen & income' },
  { id: 'allocation', label: 'Allocation', icon: PieChart, description: 'Alokasi aset' },
  { id: 'investment-reports', label: 'Reports', icon: FileText, description: 'Laporan investasi' },
];

// Mega Menu structure - horizontal layout
const megaMenuItems: MegaMenuItem[] = [
  {
    id: 'personal',
    label: 'Personal',
    icon: Wallet,
    subMenus: [
      {
        title: 'Overview',
        items: [
          { id: 'overview', label: 'Dashboard', description: 'Ringkasan keuangan', icon: LayoutDashboard },
          { id: 'budget', label: 'Transactions', description: 'Pemasukan & pengeluaran', icon: ArrowUpDown },
          { id: 'networth', label: 'Net Worth', description: 'Aset vs liabilitas', icon: TrendingUp },
        ],
      },
      {
        title: 'Planning',
        items: [
          { id: 'budgeting', label: 'Budgeting', description: 'Budget per kategori', icon: PieChart },
          { id: 'goals', label: 'Goals', description: 'Tabungan & target', icon: Target },
          { id: 'recurring', label: 'Recurring', description: 'Tagihan & langganan', icon: RefreshCw },
        ],
      },
      {
        title: 'More',
        items: [
          { id: 'debts', label: 'Debts', description: 'Utang & cicilan', icon: CreditCard },
          { id: 'analytics', label: 'Reports', description: 'Laporan keuangan', icon: FileText },
        ],
      },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: Briefcase,
    subMenus: [
      {
        title: 'Overview',
        items: [
          { id: 'business', label: 'Dashboard', description: 'Snapshot bisnis', icon: Building2 },
          { id: 'business-transactions', label: 'Transactions', description: 'Transaksi bisnis', icon: Receipt },
          { id: 'cashflow', label: 'Cash Flow', description: 'Inflow vs outflow', icon: Banknote },
        ],
      },
      {
        title: 'Operations',
        items: [
          { id: 'invoices', label: 'Invoices', description: 'Buat & kelola invoice', icon: FileSpreadsheet },
          { id: 'business-expenses', label: 'Expenses', description: 'Biaya operasional', icon: Calculator },
        ],
      },
      {
        title: 'Analysis',
        items: [
          { id: 'business-reports', label: 'Reports', description: 'Profit & Loss', icon: BarChart3 },
          { id: 'business-settings', label: 'Settings', description: 'Pengaturan bisnis', icon: Settings },
        ],
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    icon: BrainCircuit,
    subMenus: [
      {
        title: 'Assistant',
        items: [
          { id: 'ai-dashboard', label: 'AI Dashboard', description: 'Ringkasan insight AI', icon: LayoutDashboard },
          { id: 'advisor', label: 'AI Advisor', description: 'Chat AI keuangan', icon: Bot },
        ],
      },
      {
        title: 'Tools',
        items: [
          { id: 'smart-insights', label: 'Smart Insights', description: 'Anomali & warning', icon: Sparkles },
          { id: 'scanners', label: 'Scanners', description: 'Receipt scanner', icon: ScanLine },
        ],
      },
      {
        title: 'Analysis',
        items: [
          { id: 'forecasting', label: 'Forecasting', description: 'Proyeksi keuangan', icon: TrendingUp },
          { id: 'ai-settings', label: 'AI Settings', description: 'Kontrol privasi', icon: Settings },
        ],
      },
    ],
  },
  {
    id: 'investment',
    label: 'Investment',
    icon: TrendingUp,
    subMenus: [
      {
        title: 'Portfolio',
        items: [
          { id: 'investments', label: 'Overview', description: 'Ringkasan investasi', icon: PieChart },
          { id: 'holdings', label: 'Holdings', description: 'Saham & crypto', icon: Wallet },
        ],
      },
      {
        title: 'Analytics',
        items: [
          { id: 'performance', label: 'Performance', description: 'Performa portfolio', icon: LineChart },
          { id: 'dividends', label: 'Dividends', description: 'Dividen & income', icon: CircleDollarSign },
        ],
      },
      {
        title: 'Strategy',
        items: [
          { id: 'allocation', label: 'Allocation', description: 'Alokasi aset', icon: PieChart },
          { id: 'investment-reports', label: 'Reports', description: 'Laporan investasi', icon: FileText },
        ],
      },
    ],
  },
];

export function DashboardHeader({ activeTab, onChangeTab, onLogout }: DashboardHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [mobileSection, setMobileSection] = React.useState<string | null>(null);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleTabClick = (tabId: string) => {
    onChangeTab(tabId);
    setOpen(false);
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-out',
        scrolled
          ? 'bg-background/60 backdrop-blur-xl border-b border-white/10 shadow-[0_2px_20px_-2px_rgba(0,0,0,0.3)]'
          : 'bg-gradient-to-b from-background/80 to-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 transition-transform duration-200 hover:scale-105"
          >
            <img src={axentLogo} alt="Axent" className="h-20 w-auto" />
          </Link>

          {/* Desktop Navigation - Mega Menu */}
          <div className="hidden lg:block ml-8">
            <MegaMenu
              items={megaMenuItems}
              activeTab={activeTab}
              onItemClick={handleTabClick}
            />
          </div>

          {/* Desktop Global Menu (Right) */}
          <div className="hidden lg:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              <Bell size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10"
            >
              <Search size={18} />
            </Button>
            <div className="w-px h-6 bg-border/50 mx-2" />
            <Link
              to="/profile"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10'
              )}
            >
              <User size={18} />
            </Link>
            <Link
              to="/settings"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10'
              )}
            >
              <Settings size={18} />
            </Link>
            <Link
              to="/help"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10'
              )}
            >
              <HelpCircle size={18} />
            </Link>
            <div className="w-px h-6 bg-border/50 mx-2" />
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut size={18} />
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(!open)}
            className="lg:hidden rounded-full hover:bg-white/10"
          >
            <MenuToggleIcon open={open} className="size-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-xl transition-all duration-500 ease-out lg:hidden overflow-y-auto',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div
          className={cn(
            'flex flex-col p-6 transition-all duration-500 ease-out',
            open ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'
          )}
        >
          {/* Mobile Section: Personal */}
          <MobileSection
            title="Personal"
            icon={Wallet}
            items={personalMenu}
            activeTab={activeTab}
            isOpen={mobileSection === 'personal'}
            onToggle={() => setMobileSection(mobileSection === 'personal' ? null : 'personal')}
            onItemClick={handleTabClick}
          />

          {/* Mobile Section: Business */}
          <MobileSection
            title="Business"
            icon={Briefcase}
            items={businessMenu}
            activeTab={activeTab}
            isOpen={mobileSection === 'business'}
            onToggle={() => setMobileSection(mobileSection === 'business' ? null : 'business')}
            onItemClick={handleTabClick}
          />

          {/* Mobile Section: AI */}
          <MobileSection
            title="AI"
            icon={BrainCircuit}
            items={aiMenu}
            activeTab={activeTab}
            isOpen={mobileSection === 'ai'}
            onToggle={() => setMobileSection(mobileSection === 'ai' ? null : 'ai')}
            onItemClick={handleTabClick}
          />

          {/* Mobile Section: Investment */}
          <MobileSection
            title="Investment"
            icon={TrendingUp}
            items={investmentMenu}
            activeTab={activeTab}
            isOpen={mobileSection === 'investment'}
            onToggle={() => setMobileSection(mobileSection === 'investment' ? null : 'investment')}
            onItemClick={handleTabClick}
          />

          {/* Mobile Global Menu */}
          <div className="flex flex-col gap-1 pt-6 mt-6 border-t border-white/10">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-4">
              Menu
            </span>
            {[
              { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
              { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
              { id: 'help', label: 'Help', icon: HelpCircle, href: '/help' },
              { id: 'home', label: 'Home', icon: Home, href: '/' },
            ].map((link) => (
              <Link
                key={link.id}
                to={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium text-foreground hover:bg-white/5 transition-all"
              >
                <link.icon size={22} />
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut size={22} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Mobile Section Component
function MobileSection({
  title,
  icon: Icon,
  items,
  activeTab,
  isOpen,
  onToggle,
  onItemClick
}: {
  title: string;
  icon: React.ElementType;
  items: typeof personalMenu;
  activeTab: string;
  isOpen: boolean;
  onToggle: () => void;
  onItemClick: (id: string) => void;
}) {
  const isActiveInSection = items.some(item => item.id === activeTab);

  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-medium transition-all',
          isActiveInSection ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-white/5'
        )}
      >
        <div className="flex items-center gap-4">
          <Icon size={22} />
          <span>{title}</span>
        </div>
        <ChevronDown
          size={18}
          className={cn('transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-white/10 pl-4">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardHeader;
