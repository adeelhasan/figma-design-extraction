'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, User, Settings, Bell } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const pageName = pathname.replace('/', '') || 'Dashboard';
  const displayName = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <header className="sticky top-0 h-[45px] bg-[var(--color-background)] border-b border-[var(--color-border)] px-[var(--spacing-6)] flex items-center justify-between z-50">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-[var(--spacing-1)]">
        <span className="text-[length:var(--font-size-2xs)] text-[var(--color-secondary)]">
          Pages
        </span>
        <span className="text-[length:var(--font-size-2xs)] text-[var(--color-secondary)]">
          /
        </span>
        <span className="text-[length:var(--font-size-2xs)] font-semibold text-[var(--color-dark)]">
          {displayName}
        </span>
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-[var(--spacing-3)]">
        {/* Search */}
        <div className="flex items-center gap-[var(--spacing-2)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-full)] px-[var(--spacing-3)] py-[var(--spacing-1)] w-40">
          <Search className="w-[13px] h-[13px] text-[var(--color-secondary)] shrink-0" />
          <input
            type="text"
            placeholder="Type here…"
            className="border-none bg-transparent text-[length:var(--font-size-2xs)] text-[var(--color-dark)] outline-none w-full"
          />
        </div>

        {/* Sign In link */}
        <Link
          href="/signin"
          className="flex items-center gap-[var(--spacing-1)] no-underline text-[var(--color-body)] text-[length:var(--font-size-2xs)]"
        >
          <User className="w-3.5 h-3.5" />
          Sign In
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className="bg-transparent border-none cursor-pointer p-[var(--spacing-1)] flex items-center text-[var(--color-body)]"
        >
          <Settings className="w-4 h-4" />
        </Link>

        {/* Bell */}
        <button className="bg-transparent border-none cursor-pointer p-[var(--spacing-1)] flex items-center text-[var(--color-body)] relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[var(--color-error)] rounded-full" />
        </button>
      </div>
    </header>
  );
}
