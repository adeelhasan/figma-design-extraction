import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <div className="ml-[248px] flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-[var(--spacing-6)]">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
