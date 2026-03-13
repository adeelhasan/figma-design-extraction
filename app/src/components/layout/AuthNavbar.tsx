import Link from 'next/link';
import { LayoutDashboard, User, UserPlus, CalendarDays } from 'lucide-react';

export function AuthNavbar() {
  return (
    <header className="sticky top-0 h-[34px] bg-white/15 backdrop-blur-[10px] rounded-[var(--radius-full)] mx-[var(--spacing-8)] mt-[var(--spacing-4)] px-[var(--spacing-4)] flex items-center justify-between z-50 shadow-[var(--shadow-lg)]">
      <span className="font-[var(--font-family-secondary)] text-[length:var(--font-size-sm)] font-semibold text-white">
        Soft UI Dashboard
      </span>

      <nav className="flex items-center gap-[var(--spacing-4)]">
        {[
          { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Profile', href: '/profile', icon: User },
          { label: 'Sign Up', href: '/signup', icon: UserPlus },
          { label: 'Sign In', href: '/signin', icon: CalendarDays },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-[var(--spacing-1)] no-underline text-white/85 text-[length:var(--font-size-2xs)]"
          >
            <item.icon className="w-3 h-3" />
            {item.label}
          </Link>
        ))}
      </nav>

      <a
        href="#"
        className="inline-flex items-center px-[var(--spacing-3)] py-[var(--spacing-1)] bg-white text-[var(--color-dark)] text-[0.625rem] font-bold no-underline rounded-[var(--radius-full)] uppercase tracking-[0.06em] whitespace-nowrap"
      >
        FREE DOWNLOAD
      </a>
    </header>
  );
}
