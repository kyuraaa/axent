'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MegaMenuItem = {
  id: string;
  label: string;
  icon?: React.ElementType;
  subMenus?: {
    title: string;
    items: {
      id: string;
      label: string;
      description: string;
      icon: React.ElementType;
    }[];
  }[];
  link?: string;
};

export interface MegaMenuProps extends React.HTMLAttributes<HTMLElement> {
  items: MegaMenuItem[];
  activeTab?: string;
  onItemClick?: (id: string) => void;
  className?: string;
}

const MegaMenu = React.forwardRef<HTMLElement, MegaMenuProps>(
  ({ items, activeTab, onItemClick, className, ...props }, ref) => {
    const [openMenu, setOpenMenu] = React.useState<string | null>(null);
    const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

    const handleHover = (menuLabel: string | null) => {
      setOpenMenu(menuLabel);
    };

    const isActiveInSubmenu = (subMenus?: MegaMenuItem['subMenus']) => {
      if (!subMenus) return false;
      return subMenus.some(sub => sub.items.some(item => item.id === activeTab));
    };

    return (
      <nav
        ref={ref}
        className={cn('flex items-center gap-1', className)}
        {...props}
      >
        {items.map((navItem) => {
          const Icon = navItem.icon;
          const isActive = isActiveInSubmenu(navItem.subMenus);
          
          return (
            <div
              key={navItem.id}
              className="relative"
              onMouseEnter={() => handleHover(navItem.label)}
              onMouseLeave={() => handleHover(null)}
            >
              <button
                onMouseEnter={() => setHoveredItem(navItem.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 relative',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {Icon && <Icon size={16} />}
                <span>{navItem.label}</span>
                {navItem.subMenus && (
                  <ChevronDown
                    size={14}
                    className={cn(
                      'opacity-50 transition-transform duration-300',
                      openMenu === navItem.label && 'rotate-180'
                    )}
                  />
                )}
                
                {/* Hover/Active underline */}
                {(hoveredItem === navItem.id || openMenu === navItem.label || isActive) && (
                  <motion.span
                    layoutId="mega-menu-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>

              {/* Mega Menu Dropdown */}
              <AnimatePresence>
                {openMenu === navItem.label && navItem.subMenus && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute top-full left-0 pt-2 z-50"
                  >
                    <div className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/20 overflow-hidden">
                      {/* Horizontal layout for submenus */}
                      <div className="flex divide-x divide-white/5">
                        {navItem.subMenus.map((sub, subIndex) => (
                          <div key={sub.title} className="p-4 min-w-[220px]">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                              {sub.title}
                            </h3>
                            <div className="flex flex-col gap-0.5">
                              {sub.items.map((item, itemIndex) => {
                                const ItemIcon = item.icon;
                                const isItemActive = activeTab === item.id;
                                
                                return (
                                  <motion.button
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ 
                                      duration: 0.2, 
                                      delay: (subIndex * 0.05) + (itemIndex * 0.03)
                                    }}
                                    onClick={() => {
                                      onItemClick?.(item.id);
                                      setOpenMenu(null);
                                    }}
                                    className={cn(
                                      'flex items-start gap-3 p-2.5 rounded-lg text-left transition-all duration-200 group',
                                      isItemActive
                                        ? 'bg-primary/10 text-primary'
                                        : 'hover:bg-white/5 text-foreground'
                                    )}
                                  >
                                    <div className={cn(
                                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200',
                                      isItemActive
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-white/5 text-muted-foreground group-hover:bg-white/10 group-hover:text-foreground'
                                    )}>
                                      <ItemIcon size={16} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-medium text-sm truncate">
                                        {item.label}
                                      </span>
                                      <span className="text-xs text-muted-foreground line-clamp-1">
                                        {item.description}
                                      </span>
                                    </div>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    );
  }
);

MegaMenu.displayName = 'MegaMenu';

export default MegaMenu;
