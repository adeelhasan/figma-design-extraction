import { Button, Card, CardContent } from '@/components/ui';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-[var(--color-background)]">
      <Card className="text-center max-w-md">
        <CardContent>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
            Soft UI Dashboard
          </h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            Design system extracted from Figma, with generated React components
          </p>

          <div className="flex gap-4 justify-center">
            <a href="/dashboard">
              <Button>View Dashboard</Button>
            </a>
            <a href="/signin">
              <Button variant="outline">Sign In</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8 text-xs text-[var(--color-text-muted)]">
        Built with design tokens from Figma
      </p>
    </main>
  );
}
