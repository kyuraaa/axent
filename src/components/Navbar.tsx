
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import axentLogo from '@/assets/solid_white_text-removebg-preview.png';

const navItems = [
  { label: 'Overview', href: '#hero' },
  { label: 'Features', href: '#features' },
  { label: 'Products', href: '#products' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

const Navbar = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  // Scroll-spy: highlight nav item matching the visible section
  useEffect(() => {
    const ids = navItems
      .filter(i => i.href.startsWith('#'))
      .map(i => i.href.slice(1));

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = navItems.findIndex(i => i.href === `#${entry.target.id}`);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { threshold: 0.4 }
    );

    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    item: typeof navItems[number],
    idx: number
  ) => {
    e.preventDefault();
    setActiveIndex(idx);
    setIsOpen(false);
    scrollTo(item.href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] py-3 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* ── Logo ── */}
        <Link to="/" className="flex-shrink-0">
          <img src={axentLogo} alt="Axent" className="h-12 sm:h-16 w-auto" />
        </Link>

        {/* ── Desktop: Pill Nav ── */}
        <nav className="hidden lg:flex items-center">
          <div className="flex items-center gap-0.5 bg-white/8 backdrop-blur-xl border border-white/12 rounded-full px-1.5 py-1.5 shadow-lg">
            {navItems.map((item, idx) => {
              const isActive = activeIndex === idx;
              return (
                <div key={item.label} className="relative">
                  <a
                    href={item.href}
                    onClick={e => handleNavClick(e, item, idx)}
                    className={cn(
                      'block px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer',
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    )}
                  >
                    {item.label}
                  </a>
                </div>
              );
            })}
          </div>
        </nav>

        {/* ── Desktop: Contact Us CTA ── */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={() => navigate('/auth')}
            className="px-5 py-2 rounded-full border border-white/25 text-sm font-medium text-white bg-white/8 backdrop-blur-md hover:bg-white/15 hover:border-white/40 transition-all duration-200"
          >
            Get Started
          </button>
        </div>

        {/* ── Mobile: Hamburger ── */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className="lg:hidden text-white p-1"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={cn(
          'fixed inset-0 lg:hidden bg-background/97 backdrop-blur-xl z-40 transition-all duration-300 pt-16',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {isOpen && (
          <ul className="flex flex-col items-center gap-2 p-6 animate-fade-in">
            {navItems.map((item, idx) => (
              <li key={item.label} className="w-full max-w-xs">
                <a
                  href={item.href}
                  onClick={e => handleNavClick(e, item, idx)}
                  className={cn(
                    'block text-center w-full py-3 rounded-xl text-base font-medium transition-colors',
                    activeIndex === idx
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white'
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="w-full max-w-xs mt-4">
              <button
                onClick={() => { navigate('/auth'); setIsOpen(false); }}
                className="w-full py-3 rounded-full border border-white/25 text-sm font-medium text-white bg-white/8 hover:bg-white/15 transition-all"
              >
                Get Started
              </button>
            </li>
          </ul>
        )}
      </div>
    </header>
  );
};

export default Navbar;
