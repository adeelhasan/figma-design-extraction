'use client';

import { useState } from 'react';
import { Button, Input, Checkbox, Card, CardContent } from '@/components/ui';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign in
    console.log('Sign in:', { email, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
      <Card className="w-full max-w-md">
        <CardContent>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Enter your email and password to sign in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <Checkbox label="Remember me" />
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
            Don&apos;t have an account?{' '}
            <a
              href="/signup"
              className="text-[var(--color-primary)] hover:underline font-medium"
            >
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
