
import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, PieChart, TrendingUp, BrainCircuit, LineChart, User, Home, Settings, HelpCircle, Briefcase, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import axentLogo from '@/assets/solid_white_text-removebg-preview.png';

interface DashboardSidebarProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onLogout?: () => void;
}

const DashboardSidebar = ({ activeTab, onChangeTab, onLogout }: DashboardSidebarProps) => {
  const personalMenuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'budget', label: 'Budget Tracker', icon: PieChart },
    { id: 'investments', label: 'Investments', icon: TrendingUp },
    { id: 'advisor', label: 'Financial Advisor', icon: BrainCircuit },
    { id: 'analytics', label: 'Expense Analytics', icon: LineChart },
  ];

  const businessMenuItems = [
    { id: 'business', label: 'Business Finance', icon: Briefcase },
    { id: 'business-analytics', label: 'Business Analytics', icon: LineChart },
  ];

  const bottomMenuItems = [
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
    { id: 'home', label: 'Back to Home', icon: Home, href: '/' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, href: '/help' },
    { id: 'logout', label: 'Logout', icon: LogOut, action: onLogout },
  ];

  return (
    <aside className="glass-card p-4 sm:p-6 h-fit sticky top-24">
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <img src={axentLogo} alt="Axent" className="h-20 sm:h-24 w-auto" />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-white/50 mb-2 sm:mb-3 px-2 sm:px-3">PERSONAL</h3>
          <ul className="space-y-0.5 sm:space-y-1">
            {personalMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onChangeTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base",
                    activeTab === item.id
                      ? "bg-budgify-500/20 text-budgify-400"
                      : "hover:bg-white/5"
                  )}
                >
                  <item.icon size={16} className={cn("sm:w-[18px] sm:h-[18px]", activeTab === item.id ? "text-budgify-400" : "text-white/60")} />
                  <span className={activeTab === item.id ? "font-medium" : "text-white/70"}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs sm:text-sm font-medium text-white/50 mb-2 sm:mb-3 px-2 sm:px-3">BUSINESS</h3>
          <ul className="space-y-0.5 sm:space-y-1">
            {businessMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onChangeTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all text-sm sm:text-base",
                    activeTab === item.id
                      ? "bg-budgify-500/20 text-budgify-400"
                      : "hover:bg-white/5"
                  )}
                >
                  <item.icon size={16} className={cn("sm:w-[18px] sm:h-[18px]", activeTab === item.id ? "text-budgify-400" : "text-white/60")} />
                  <span className={activeTab === item.id ? "font-medium" : "text-white/70"}>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-3 sm:pt-4 border-t border-white/10">
          <h3 className="text-xs sm:text-sm font-medium text-white/50 mb-2 sm:mb-3 px-2 sm:px-3">OTHER</h3>
          <ul className="space-y-0.5 sm:space-y-1">
            {bottomMenuItems.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <Link
                    to={item.href}
                    className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all hover:bg-white/5 text-sm sm:text-base"
                  >
                    <item.icon size={16} className="text-white/60 sm:w-[18px] sm:h-[18px]" />
                    <span className="text-white/70">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    onClick={item.action}
                    className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all hover:bg-white/5 text-sm sm:text-base"
                  >
                    <item.icon size={16} className="text-white/60 sm:w-[18px] sm:h-[18px]" />
                    <span className="text-white/70">{item.label}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
