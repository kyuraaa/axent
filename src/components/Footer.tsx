
import React from 'react';
import { Link } from 'react-router-dom';
import axentLogo from '@/assets/solid_white_text-removebg-preview.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'Pricing', href: '/#features' },
        { label: 'Integrations', href: '/#features' },
        { label: 'Changelog', href: '/#features' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog', href: '/learn-more' },
        { label: 'Documentation', href: '/help' },
        { label: 'Guides', href: '/help' },
        { label: 'Help Center', href: '/help' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/learn-more' },
        { label: 'Careers', href: '/learn-more' },
        { label: 'Contact', href: '/help' },
        { label: 'Partners', href: '/learn-more' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/learn-more' },
        { label: 'Terms of Service', href: '/learn-more' },
        { label: 'Cookie Policy', href: '/learn-more' },
        { label: 'GDPR', href: '/learn-more' },
      ]
    }
  ];

  return (
    <footer className="px-3 sm:px-4 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6 border-t border-white/10">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="col-span-2 sm:col-span-3 md:col-span-2 mb-3 sm:mb-0">
            <div className="flex items-center gap-1.5 mb-2 md:mb-3">
              <img src={axentLogo} alt="Axent" className="h-12 sm:h-14 md:h-20 w-auto" />
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-white/70 mb-3 md:mb-4 max-w-xs">
              AI-powered financial solutions to help you manage your money smarter and achieve your goals faster.
            </p>
            <div className="flex space-x-2 md:space-x-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="text-white/80 sm:w-3.5 sm:h-3.5">
                  <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="text-white/80 sm:w-3.5 sm:h-3.5">
                  <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z" />
                </svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="text-white/80 sm:w-3.5 sm:h-3.5">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
                </svg>
              </a>
            </div>
          </div>

          {sections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-1.5 sm:mb-2 md:mb-3 text-[10px] sm:text-xs md:text-sm">{section.title}</h3>
              <ul className="space-y-1 sm:space-y-1.5 md:space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link to={link.href} className="text-[9px] sm:text-[10px] md:text-xs text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-4 md:pt-6 text-center">
          <p className="text-white/50 text-[10px] md:text-xs">
            © {currentYear} Axent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
