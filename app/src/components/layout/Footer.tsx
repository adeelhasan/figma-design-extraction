export function Footer() {
  return (
    <footer className="w-full h-5 bg-transparent px-[var(--spacing-6)] flex items-center justify-between border-t border-[var(--color-border)]">
      <span className="text-[length:var(--font-size-2xs)] text-[var(--color-body)]">
        © 2021, made with{' '}
        <span className="text-[var(--color-error)]">♥</span> by{' '}
        <a href="#" className="text-[var(--color-dark)] font-semibold no-underline">
          Creative Tim
        </a>{' '}
        for a better web.
      </span>
      <nav className="flex items-center gap-[var(--spacing-4)]">
        {['Creative Tim', 'About Us', 'Blog', 'License'].map((link) => (
          <a
            key={link}
            href="#"
            className="text-[length:var(--font-size-2xs)] text-[var(--color-body)] no-underline"
          >
            {link}
          </a>
        ))}
      </nav>
    </footer>
  );
}
