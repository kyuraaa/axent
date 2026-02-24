
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Check, ArrowRight } from 'lucide-react';

const LearnMore = () => {
  return (
    <div className="min-h-screen font-montserrat">
      <Navbar />
      
      {/* Hero section for Learn More page */}
      <section className="pt-32 pb-16 px-6 md:px-12 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 rounded-full bg-budgify-500/10 blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 rounded-full bg-emerald-600/10 blur-[100px] -z-10"></div>
        
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-budgify-400 hover:text-budgify-300 transition-colors mb-8">
            <ArrowLeft size={16} />
            Back to home
          </Link>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
            Discover Budgify's Financial Tools
          </h1>
          
          <p className="text-xl text-white/80 max-w-3xl mb-12">
            Explore our comprehensive suite of financial management tools designed to help you take control of your financial future.
          </p>
        </div>
      </section>
      
      {/* Core Features */}
      <section className="py-16 px-6 md:px-12 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Core Financial Tools</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            {/* Smart Budgeting */}
            <div className="glass-card p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-budgify-400 to-budgify-600"></div>
              <h3 className="text-2xl font-bold mb-4 text-budgify-400">Smart Budgeting</h3>
              <p className="text-white/80 mb-6">
                Our AI-powered budgeting tools analyze your spending patterns and financial habits to create personalized budgeting recommendations that align with your goals.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-budgify-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-budgify-500" />
                  </div>
                  <span>Automatic expense categorization</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-budgify-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-budgify-500" />
                  </div>
                  <span>Customizable spending limits</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-budgify-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-budgify-500" />
                  </div>
                  <span>Real-time alerts for budget overruns</span>
                </li>
              </ul>
              <Link to="/dashboard?tab=budget" className="text-budgify-400 inline-flex items-center gap-2 font-medium hover:text-budgify-300 transition-colors">
                Try Smart Budgeting
                <ArrowRight size={16} />
              </Link>
            </div>
            
            {/* Investment Tracking */}
            <div className="glass-card p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
              <h3 className="text-2xl font-bold mb-4 text-green-400">Investment Tracking</h3>
              <p className="text-white/80 mb-6">
                Monitor your investments in real-time with advanced analytics and AI-powered recommendations to optimize your portfolio performance.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-green-500" />
                  </div>
                  <span>Real-time market data integration</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-green-500" />
                  </div>
                  <span>Portfolio diversification analysis</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-green-500" />
                  </div>
                  <span>Risk assessment and recommendations</span>
                </li>
              </ul>
              <Link to="/dashboard?tab=investments" className="text-green-400 inline-flex items-center gap-2 font-medium hover:text-green-300 transition-colors">
                Try Investment Tracking
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* AI Financial Advisor */}
            <div className="glass-card p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-600"></div>
              <h3 className="text-2xl font-bold mb-4 text-emerald-400">AI Financial Advisor</h3>
              <p className="text-white/80 mb-6">
                Get personalized financial advice from our AI advisor, which analyzes your financial situation and provides tailored recommendations.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-emerald-500" />
                  </div>
                  <span>Real-time market insights</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-emerald-500" />
                  </div>
                  <span>Personalized financial strategies</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-emerald-500" />
                  </div>
                  <span>24/7 access to financial guidance</span>
                </li>
              </ul>
              <Link to="/dashboard?tab=advisor" className="text-emerald-400 inline-flex items-center gap-2 font-medium hover:text-emerald-300 transition-colors">
                Try AI Financial Advisor
                <ArrowRight size={16} />
              </Link>
            </div>
            
            {/* Expense Analytics */}
            <div className="glass-card p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
              <h3 className="text-2xl font-bold mb-4 text-green-400">Expense Analytics</h3>
              <p className="text-white/80 mb-6">
                Visualize your spending patterns with detailed analytics to identify opportunities for savings and better financial management.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-green-500" />
                  </div>
                  <span>Interactive spending dashboards</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-green-500" />
                  </div>
                  <span>Custom report generation</span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 mr-3 flex items-center justify-center mt-1">
                    <Check size={12} className="text-green-500" />
                  </div>
                  <span>Trend analysis and predictions</span>
                </li>
              </ul>
              <Link to="/dashboard?tab=analytics" className="text-green-400 inline-flex items-center gap-2 font-medium hover:text-green-300 transition-colors">
                Try Expense Analytics
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Additional Features */}
      <section className="py-16 px-6 md:px-12 bg-gradient-to-b from-transparent to-background/80 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Additional Financial Tools</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Business Finance */}
            <div className="glass-card p-6 relative overflow-hidden">
              <h3 className="text-xl font-bold mb-3 text-emerald-400">Business Finance Tools</h3>
              <p className="text-white/80 mb-4">
                Comprehensive tools for business expense tracking, profit analysis, and business budgeting.
              </p>
              <Link to="/dashboard" className="text-emerald-400 inline-flex items-center gap-2 text-sm hover:text-emerald-300 transition-colors">
                Learn more
                <ArrowRight size={14} />
              </Link>
            </div>
            
            {/* Crypto Tracking */}
            <div className="glass-card p-6 relative overflow-hidden">
              <h3 className="text-xl font-bold mb-3 text-green-400">Crypto Tracking</h3>
              <p className="text-white/80 mb-4">
                Monitor and manage your cryptocurrency investments alongside traditional assets.
              </p>
              <Link to="/dashboard" className="text-green-400 inline-flex items-center gap-2 text-sm hover:text-green-300 transition-colors">
                Learn more
                <ArrowRight size={14} />
              </Link>
            </div>
            
            {/* Tax Planning */}
            <div className="glass-card p-6 relative overflow-hidden">
              <h3 className="text-xl font-bold mb-3 text-emerald-400">Tax Planning</h3>
              <p className="text-white/80 mb-4">
                Optimize your tax strategy with AI-powered recommendations and forecasting.
              </p>
              <Link to="/dashboard" className="text-emerald-400 inline-flex items-center gap-2 text-sm hover:text-emerald-300 transition-colors">
                Learn more
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-20 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-budgify-500/10 via-transparent to-budgify-500/10 blur-xl -z-10"></div>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your financial future?</h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are taking control of their finances with Budgify's comprehensive suite of financial tools.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/dashboard" className="btn-glow bg-budgify-600 text-white font-medium rounded-full px-8 py-3 hover:bg-budgify-500 transition-colors">
              Get started for free
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LearnMore;