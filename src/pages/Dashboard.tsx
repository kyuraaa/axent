import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import DashboardOverview from '@/components/dashboard/overview/DashboardOverview';
import BudgetTracker from '@/components/dashboard/BudgetTracker';
import InvestmentPortfolio from '@/components/dashboard/InvestmentPortfolio';
import FinancialAdvisor from '@/components/dashboard/FinancialAdvisor';
import ExpenseAnalytics from '@/components/dashboard/ExpenseAnalytics';
import BusinessFinance from '@/components/dashboard/BusinessFinance';
import BusinessAnalytics from '@/components/dashboard/BusinessAnalytics';
import DashboardSidebarNav from '@/components/dashboard/DashboardSidebarNav';
import { BgGradient } from '@/components/ui/bg-gradient';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

// Personal Finance Components
import NetWorthTracker from '@/components/dashboard/personal/NetWorthTracker';
import BudgetingManager from '@/components/dashboard/personal/BudgetingManager';
import GoalsTracker from '@/components/dashboard/personal/GoalsTracker';
import RecurringManager from '@/components/dashboard/personal/RecurringManager';
import DebtsManager from '@/components/dashboard/personal/DebtsManager';

// Investment Components
import HoldingsOverview from '@/components/dashboard/investments/HoldingsOverview';
import PerformanceAnalytics from '@/components/dashboard/investments/PerformanceAnalytics';
import DividendsTracker from '@/components/dashboard/investments/DividendsTracker';
import AllocationManager from '@/components/dashboard/investments/AllocationManager';
import InvestmentReports from '@/components/dashboard/investments/InvestmentReports';

// AI Components
import AIDashboard from '@/components/dashboard/ai/AIDashboard';
import SmartInsights from '@/components/dashboard/ai/SmartInsights';
import Scanners from '@/components/dashboard/ai/Scanners';
import Forecasting from '@/components/dashboard/ai/Forecasting';
import AISettings from '@/components/dashboard/ai/AISettings';

// Business Components
import BusinessTransactions from '@/components/dashboard/business/BusinessTransactions';
import InvoiceManager from '@/components/dashboard/business/InvoiceManager';
import CashFlowManager from '@/components/dashboard/business/CashFlowManager';
import BusinessExpenses from '@/components/dashboard/business/BusinessExpenses';
import BusinessSettings from '@/components/dashboard/business/BusinessSettings';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        // Check for mock tester session
        const isTester = localStorage.getItem('isTester');
        if (isTester === 'true') {
          const mockUser = JSON.parse(localStorage.getItem('testerUser') || '{}');
          setUser(mockUser);
          setSession({ user: mockUser } as any);
          setLoading(false);
          return;
        }

        setLoading(false);
        navigate('/auth');
        return;
      }

      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factorsData?.totp?.filter(f => f.status === 'verified') || [];

      if (verifiedFactors.length > 0) {
        const { data: { currentLevel } } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (currentLevel !== 'aal2') {
          await supabase.auth.signOut();
          navigate('/auth');
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const handleLogout = async () => {
    localStorage.removeItem('isTester');
    localStorage.removeItem('testerUser');
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Memuat...</p>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      // PERSONAL
      case 'overview':
        return <DashboardOverview />;
      case 'budget':
        return <BudgetTracker />;
      case 'budgeting':
        return <BudgetingManager />;
      case 'goals':
        return <GoalsTracker />;
      case 'recurring':
        return <RecurringManager />;
      case 'debts':
        return <DebtsManager />;
      case 'networth':
        return <NetWorthTracker />;
      case 'analytics':
        return <ExpenseAnalytics />;

      // BUSINESS
      case 'business':
        return <BusinessFinance />;
      case 'business-transactions':
        return <BusinessTransactions />;
      case 'invoices':
        return <InvoiceManager />;
      case 'cashflow':
        return <CashFlowManager />;
      case 'business-expenses':
        return <BusinessExpenses />;
      case 'business-reports':
        return <BusinessAnalytics />;
      case 'business-settings':
        return <BusinessSettings />;

      // AI
      case 'ai-dashboard':
        return <AIDashboard />;
      case 'advisor':
        return <FinancialAdvisor onChatbotToggle={setIsChatbotOpen} />;
      case 'smart-insights':
        return <SmartInsights />;
      case 'scanners':
        return <Scanners />;
      case 'forecasting':
        return <Forecasting />;
      case 'ai-settings':
        return <AISettings />;

      // INVESTMENT
      case 'investments':
        return <InvestmentPortfolio />;
      case 'holdings':
        return <HoldingsOverview />;
      case 'performance':
        return <PerformanceAnalytics />;
      case 'dividends':
        return <DividendsTracker />;
      case 'allocation':
        return <AllocationManager />;
      case 'investment-reports':
        return <InvestmentReports />;

      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen relative bg-background">
      {/* Gradient Background */}
      <BgGradient
        gradientFrom="hsl(var(--primary) / 0.15)"
        gradientTo="hsl(var(--background))"
        gradientSize="150% 150%"
        gradientPosition="50% 0%"
        gradientStop="60%"
      />

      {/* Sidebar */}
      {!isChatbotOpen && (
        <DashboardSidebarNav
          activeTab={activeTab}
          onChangeTab={handleTabChange}
          onLogout={handleLogout}
          isMobileOpen={isMobileSidebarOpen}
          onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
      )}

      <main className={`
        ${isChatbotOpen ? '' : 'lg:ml-[260px]'} 
        min-h-screen relative z-10 transition-all duration-300
        ${isMobile && !isChatbotOpen ? 'pt-14' : ''}
      `}>
        <div className={`${isChatbotOpen ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 py-4 lg:py-6'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
