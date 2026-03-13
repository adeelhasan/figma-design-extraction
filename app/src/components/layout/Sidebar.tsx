'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Table,
  CreditCard,
  Settings,
  User,
  FileText,
  Rocket,
  BookOpen,
  Zap,
} from 'lucide-react';

const mainNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tables', href: '/tables', icon: Table },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'RTL', href: '#', icon: Settings },
];

const accountNav = [
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Sign In', href: '/signin', icon: FileText },
  { label: 'Sign Up', href: '/signup', icon: Rocket },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed left-0 top-0 w-[248px] h-screen bg-white/80 backdrop-blur-[10px] border-r border-[var(--color-border)] flex flex-col overflow-y-auto z-[100] shadow-[var(--shadow-lg)]"
      style={{ padding: 'var(--spacing-4)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-[var(--spacing-3)] border-b border-[var(--color-border)] mb-[var(--spacing-2)]"
        style={{ padding: 'var(--spacing-4) var(--spacing-2)' }}
      >
        <div className="w-8 h-8 bg-[image:var(--gradient-primary)] rounded-[var(--radius-md)] flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-[var(--font-family-secondary)] text-[length:var(--font-size-sm)] font-semibold text-[var(--color-dark)] whitespace-nowrap">
          Soft UI Dashboard
        </span>
      </div>

      {/* Main Nav */}
      <ul className="flex-1 flex flex-col gap-[var(--spacing-1)] list-none p-0 m-0">
        {mainNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-[var(--spacing-3)] px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] no-underline',
                  'text-[length:var(--font-size-sm)]',
                  isActive
                    ? 'text-[var(--color-dark)] font-semibold'
                    : 'text-[var(--color-body)] font-normal'
                )}
              >
                <span
                  className={cn(
                    'w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0',
                    isActive
                      ? 'bg-[image:var(--gradient-primary)] shadow-[0_4px_6px_rgba(203,12,159,0.4)]'
                      : 'bg-[var(--color-surface)] shadow-[var(--shadow-sm)]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5',
                      isActive ? 'text-white' : 'text-[var(--color-dark)]'
                    )}
                  />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}

        {/* Section Divider */}
        <li className="px-[var(--spacing-3)] pt-[var(--spacing-4)] pb-[var(--spacing-2)]">
          <span className="text-[0.625rem] font-bold text-[var(--color-secondary)] tracking-[0.08em] uppercase">
            ACCOUNT PAGES
          </span>
        </li>

        {accountNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-[var(--spacing-3)] px-[var(--spacing-3)] py-[var(--spacing-2)] rounded-[var(--radius-md)] no-underline',
                  'text-[length:var(--font-size-sm)]',
                  isActive
                    ? 'text-[var(--color-dark)] font-semibold'
                    : 'text-[var(--color-body)] font-normal'
                )}
              >
                <span
                  className={cn(
                    'w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0',
                    isActive
                      ? 'bg-[image:var(--gradient-primary)] shadow-[0_4px_6px_rgba(203,12,159,0.4)]'
                      : 'bg-[var(--color-surface)] shadow-[var(--shadow-sm)]'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5',
                      isActive ? 'text-white' : 'text-[var(--color-dark)]'
                    )}
                  />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Help Card */}
      <div className="mx-[var(--spacing-2)] mt-[var(--spacing-4)] mb-[var(--spacing-2)] p-[var(--spacing-4)] bg-[image:var(--gradient-dark)] rounded-[var(--radius-xl)] relative overflow-hidden text-center">
        <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -bottom-[30px] -left-2.5 w-[60px] h-[60px] rounded-full bg-white/[0.07]" />
        <div className="w-10 h-10 bg-[image:var(--gradient-primary)] rounded-[var(--radius-md)] flex items-center justify-center mx-auto mb-[var(--spacing-3)] relative z-[1]">
          <BookOpen className="w-[18px] h-[18px] text-white" />
        </div>
        <p className="text-[length:var(--font-size-sm)] font-semibold text-white m-0 mb-[var(--spacing-1)] relative z-[1]">
          Need help?
        </p>
        <p className="text-[length:var(--font-size-2xs)] text-white/70 m-0 mb-[var(--spacing-3)] relative z-[1]">
          Please check our docs
        </p>
        <a
          href="#"
          className="inline-block px-[var(--spacing-4)] py-[var(--spacing-2)] bg-white text-[var(--color-dark)] text-[length:var(--font-size-2xs)] font-bold no-underline rounded-[var(--radius-full)] uppercase tracking-[0.06em] relative z-[1]"
        >
          DOCUMENTATION
        </a>
      </div>
    </nav>
  );
}
