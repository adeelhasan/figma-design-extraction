export function AuthFooter() {
  return (
    <footer className="w-full py-[var(--spacing-8)] px-[var(--spacing-6)] flex flex-col items-center gap-[var(--spacing-4)] bg-transparent">
      {/* Social Icons */}
      <div className="flex items-center gap-[var(--spacing-4)]">
        {['Instagram', 'Twitter', 'Pinterest', 'GitHub'].map((name) => (
          <a
            key={name}
            href="#"
            aria-label={name}
            className="w-7 h-7 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-secondary)] no-underline"
          >
            <span className="text-xs">{name[0]}</span>
          </a>
        ))}
      </div>

      {/* Footer Links */}
      <nav className="flex flex-wrap justify-center gap-[var(--spacing-4)]">
        {['Company', 'About Us', 'Team', 'Products', 'Blog', 'Pricing'].map(
          (link, i) => (
            <span
              key={link}
              className={`text-[length:var(--font-size-2xs)] text-[var(--color-secondary)] ${
                i === 0 ? 'font-semibold' : ''
              }`}
            >
              {i === 0 ? (
                link
              ) : (
                <a href="#" className="text-[var(--color-secondary)] no-underline">
                  {link}
                </a>
              )}
            </span>
          )
        )}
      </nav>

      <p className="text-[length:var(--font-size-2xs)] text-[var(--color-secondary)] m-0 text-center">
        Copyright © 2021 Soft by Creative Tim.
      </p>
    </footer>
  );
}
