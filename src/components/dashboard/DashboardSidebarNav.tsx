'use client';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Gauge,
  ArrowUpDown,
  TrendingUp,
  PieChart,
  Target,
  RefreshCcw,
  CreditCard,
  FileText,
  Building2,
  Receipt,
  Banknote,
  FileSpreadsheet,
  Calculator,
  BarChart3,
  Settings,
  Cpu,
  MessageSquare,
  Sparkles,
  ScanLine,
  Coins,
  Wallet,
  LineChart,
  CircleDollarSign,
  Briefcase,
  Brain,
  User,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import axentLogo from '@/assets/solid_white_text-removebg-preview.png';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardSidebarNavProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

const StaticIcon = ({
  icon: Icon,
  size = 20,
  className,
}: {
  icon: React.ElementType;
  size?: number;
  className?: string;
}) => (
  <div className="flex-shrink-0">
    <Icon size={size} className={className} strokeWidth={1.5} />
  </div>
);

// ─── Category data ────────────────────────────────────────────────────────────
type Category = 'business' | 'investment' | 'personal' | 'ai';

interface FeatureItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  features: FeatureItem[];
}

const categoryConfig: Record<Category, CategoryConfig> = {
  business: {
    label: 'Business',
    icon: Briefcase,
    color: 'text-amber-400',
    features: [
      { id: 'business', label: 'Dashboard', icon: Building2 },
      { id: 'business-transactions', label: 'Transactions', icon: Receipt },
      { id: 'cashflow', label: 'Cash Flow', icon: Banknote },
      { id: 'invoices', label: 'Invoices', icon: FileSpreadsheet },
      { id: 'business-expenses', label: 'Expenses', icon: Calculator },
      { id: 'business-reports', label: 'Reports', icon: BarChart3 },
      { id: 'business-settings', label: 'Settings', icon: Settings },
    ],
  },
  investment: {
    label: 'Investment',
    icon: Coins,
    color: 'text-emerald-400',
    features: [
      { id: 'investments', label: 'Overview', icon: PieChart },
      { id: 'holdings', label: 'Holdings', icon: Wallet },
      { id: 'performance', label: 'Performance', icon: LineChart },
      { id: 'dividends', label: 'Dividends', icon: CircleDollarSign },
      { id: 'allocation', label: 'Allocation', icon: PieChart },
      { id: 'investment-reports', label: 'Reports', icon: FileText },
    ],
  },
  personal: {
    label: 'Personal',
    icon: Wallet,
    color: 'text-sky-400',
    features: [
      { id: 'budget', label: 'Transactions', icon: ArrowUpDown },
      { id: 'networth', label: 'Net Worth', icon: TrendingUp },
      { id: 'budgeting', label: 'Budgeting', icon: PieChart },
      { id: 'goals', label: 'Goals', icon: Target },
      { id: 'recurring', label: 'Recurring', icon: RefreshCcw },
      { id: 'debts', label: 'Debts', icon: CreditCard },
      { id: 'analytics', label: 'Reports', icon: FileText },
    ],
  },
  ai: {
    label: 'AI Assistant',
    icon: Brain,
    color: 'text-violet-400',
    features: [
      { id: 'ai-dashboard', label: 'AI Dashboard', icon: Cpu },
      { id: 'advisor', label: 'AI Advisor', icon: MessageSquare },
      { id: 'smart-insights', label: 'Smart Insights', icon: Sparkles },
      { id: 'scanners', label: 'Scanners', icon: ScanLine },
      { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
      { id: 'ai-settings', label: 'AI Settings', icon: Settings },
    ],
  },
};

const CATEGORY_ORDER: Category[] = ['business', 'investment', 'personal', 'ai'];

const quickLinks = [
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
  { id: 'help', label: 'Help', icon: HelpCircle, href: '/help' },
  { id: 'home', label: 'Home', icon: Home, href: '/' },
];

// Resolve activeTab → which category it belongs to
function resolveCategory(activeTab: string): Category {
  for (const cat of CATEGORY_ORDER) {
    if (categoryConfig[cat].features.some((f) => f.id === activeTab)) {
      return cat;
    }
  }
  return 'business';
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DashboardSidebarNav({
  activeTab,
  onChangeTab,
  onLogout,
  isMobileOpen = false,
  onMobileToggle,
}: DashboardSidebarNavProps) {
  const [activeCategory, setActiveCategory] = useState<Category>(() =>
    resolveCategory(activeTab)
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // keep active category in sync when tab changes externally (e.g. URL)
  useEffect(() => {
    const resolved = resolveCategory(activeTab);
    setActiveCategory(resolved);
  }, [activeTab]);

  const handleCategoryClick = (cat: Category, e: React.MouseEvent) => {
    e.preventDefault();
    // Immediately switch both category AND default feature so Dashboard content syncs
    const defaultFeature = categoryConfig[cat].features[0].id;
    setActiveCategory(cat);
    onChangeTab(defaultFeature);
  };

  const handleFeatureClick = (tabId: string, e: React.MouseEvent) => {
    e.preventDefault();
    onChangeTab(tabId);
    if (isMobile && onMobileToggle) onMobileToggle();
  };

  const handleQuickLinkClick = () => {
    if (isMobile && onMobileToggle) onMobileToggle();
  };

  const features = categoryConfig[activeCategory].features;

  // ── Sidebar Content ──────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-white/10 px-4 flex-shrink-0',
          isCollapsed && !isMobile ? 'justify-center' : 'justify-between'
        )}
      >
        {(!isCollapsed || isMobile) && (
          <Link
            to="/dashboard"
            className="flex items-center"
            onClick={handleQuickLinkClick}
          >
            <img
              src={axentLogo}
              alt="Axent"
              className="h-14 w-auto"
            />
          </Link>
        )}
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileToggle}
            className="rounded-full hover:bg-white/10 h-8 w-8"
          >
            <X size={20} strokeWidth={1.5} />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-full hover:bg-white/10 h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight size={16} strokeWidth={1.5} />
            ) : (
              <ChevronLeft size={16} strokeWidth={1.5} />
            )}
          </Button>
        )}
      </div>

      {/* ── Dashboard overview shortcut ── */}
      <div className="px-3 pt-3 flex-shrink-0">
        <button
          onClick={(e) => handleFeatureClick('overview', e)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
            isCollapsed && !isMobile && 'justify-center px-2'
          )}
          title={isCollapsed && !isMobile ? 'Dashboard' : undefined}
        >
          <StaticIcon icon={Gauge} size={18} />
          {(!isCollapsed || isMobile) && <span>Dashboard</span>}
        </button>
      </div>

      {/* ── Divider ── */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="h-px bg-white/10" />
      </div>

      {/* ── "Fitur" header + category selector ── */}
      {(!isCollapsed || isMobile) && (
        <div className="px-4 flex-shrink-0">
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
            Fitur
          </span>

          <div className="mt-2 space-y-0.5">
            {CATEGORY_ORDER.map((cat) => {
              const { label, icon, color } = categoryConfig[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={(e) => handleCategoryClick(cat, e)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                    isActive
                      ? 'bg-white/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  {/* Active left indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary" />
                  )}
                  <StaticIcon
                    icon={icon}
                    size={16}
                    className={isActive ? color : undefined}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsed: show category icons only */}
      {isCollapsed && !isMobile && (
        <div className="px-2 flex flex-col items-center gap-1 flex-shrink-0">
          {CATEGORY_ORDER.map((cat) => {
            const { label, icon, color } = categoryConfig[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={(e) => handleCategoryClick(cat, e)}
                title={label}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
              >
                <StaticIcon
                  icon={icon}
                  size={18}
                  className={isActive ? color : undefined}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Divider ── */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="h-px bg-white/10" />
      </div>

      {/* ── Feature list for active category ── */}
      <ScrollArea className="flex-1 min-h-0" type="auto">
        <div className="px-3 pb-2">
          {(!isCollapsed || isMobile) && (
            <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-2 mb-1.5 block">
              {categoryConfig[activeCategory].label}
            </span>
          )}
          <div className="space-y-0.5">
            {features.map((item) => {
              const isItemActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => handleFeatureClick(item.id, e)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all duration-150',
                    isItemActive
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5',
                    isCollapsed && !isMobile && 'justify-center px-2'
                  )}
                  title={isCollapsed && !isMobile ? item.label : undefined}
                >
                  <StaticIcon icon={item.icon} size={16} />
                  {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* ── Quick Links bottom ── */}
      <div
        className={cn(
          'border-t border-white/10 px-3 py-3 space-y-1 flex-shrink-0',
          isCollapsed && !isMobile && 'px-2'
        )}
      >
        {(!isCollapsed || isMobile) && (
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-2 mb-2 block">
            Quick Links
          </span>
        )}
        {quickLinks.map((link) => (
          <Link
            key={link.id}
            to={link.href}
            onClick={handleQuickLinkClick}
            className={cn(
              'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors',
              isCollapsed && !isMobile && 'justify-center'
            )}
            title={isCollapsed && !isMobile ? link.label : undefined}
          >
            <StaticIcon icon={link.icon} size={16} />
            {(!isCollapsed || isMobile) && <span>{link.label}</span>}
          </Link>
        ))}
        <button
          onClick={() => {
            onLogout();
            handleQuickLinkClick();
          }}
          className={cn(
            'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors',
            isCollapsed && !isMobile && 'justify-center'
          )}
          title={isCollapsed && !isMobile ? 'Logout' : undefined}
        >
          <StaticIcon icon={LogOut} size={16} />
          {(!isCollapsed || isMobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  // ── Mobile layout ────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:hidden">
          <Link to="/dashboard" className="flex items-center">
            <img
              src={axentLogo}
              alt="Axent"
              className="h-10 w-auto"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileToggle}
            className="rounded-full hover:bg-white/10 h-10 w-10"
          >
            <Menu size={22} strokeWidth={1.5} />
          </Button>
        </header>

        {/* Overlay */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={onMobileToggle}
          />
        )}

        {/* Mobile Sidebar */}
        {isMobileOpen && (
          <aside className="fixed left-0 top-0 z-50 h-screen w-[280px] bg-background/95 backdrop-blur-xl border-r border-white/10 flex flex-col lg:hidden">
            <SidebarContent />
          </aside>
        )}
      </>
    );
  }

  // ── Desktop layout ───────────────────────────────────────────────────────
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-background/95 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex-col hidden lg:flex',
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      <SidebarContent />
    </aside>
  );
}

export default DashboardSidebarNav;
