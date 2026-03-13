'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthNavbar } from '@/components/layout/AuthNavbar';
import { AuthFooter } from '@/components/layout/AuthFooter';
import { Input } from '@/components/ui/Input';

export default function SignInPage() {
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div
      style={{
        fontFamily: 'var(--font-family-primary)',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        minHeight: '100vh',
      }}
    >
      {/* Navbar */}
      <AuthNavbar />

      {/* Two-column layout */}
      <main
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: 'calc(100vh - 34px)',
        }}
      >
        {/* Left column: form area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'var(--spacing-12) var(--spacing-8) var(--spacing-12) 63px',
            background: 'var(--color-surface)',
          }}
        >
          {/* Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-bold)',
              background: 'var(--gradient-info)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.033em',
              lineHeight: 1.17,
              marginBottom: 'var(--spacing-2)',
              margin: 0,
            }}
          >
            Sign In
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--color-text-muted)',
              letterSpacing: '-0.033em',
              marginTop: 0,
              marginBottom: 'var(--spacing-8)',
            }}
          >
            Enter your email and password to sign in
          </p>

          {/* Email field */}
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <Input
              label="Email"
              id="email"
              type="email"
              placeholder="Email"
              className="w-[361px]"
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="Password"
              className="w-[361px]"
            />
          </div>

          {/* Remember me toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            <button
              type="button"
              role="switch"
              aria-checked={rememberMe}
              onClick={() => setRememberMe(!rememberMe)}
              style={{
                position: 'relative',
                width: 42,
                height: 20,
                background: rememberMe ? '#3a416f' : '#c8c8c8',
                borderRadius: 10.5,
                flexShrink: 0,
                cursor: 'pointer',
                border: 'none',
                padding: 0,
                transition: 'background 0.2s ease',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: rememberMe ? 2 : undefined,
                  left: rememberMe ? undefined : 2,
                  width: 16,
                  height: 16,
                  background: 'var(--color-surface)',
                  borderRadius: 8,
                  boxShadow:
                    '0 2px 4px -1px rgba(0, 0, 0, 0.07), 0 4px 6px -1px rgba(0, 0, 0, 0.12)',
                  transition: 'all 0.2s ease',
                }}
              />
            </button>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--color-text-primary)',
              }}
            >
              Remember me
            </span>
          </div>

          {/* Sign In button */}
          <button
            type="button"
            style={{
              display: 'block',
              width: 361,
              height: 40,
              background: 'var(--gradient-info)',
              border: 'none',
              borderRadius: 8,
              boxShadow:
                '0 2px 4px -1px rgba(0, 0, 0, 0.07), 0 4px 6px -1px rgba(0, 0, 0, 0.12)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-surface)',
              textAlign: 'center',
              letterSpacing: '-0.028em',
              cursor: 'pointer',
              marginBottom: 'var(--spacing-6)',
            }}
          >
            SIGN IN
          </button>

          {/* Signup footer link */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-muted)',
                letterSpacing: '-0.028em',
              }}
            >
              Don&rsquo;t have an account?
            </span>
            <Link
              href="/signup"
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-bold)',
                background: 'var(--gradient-info)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textDecoration: 'none',
                letterSpacing: '-0.028em',
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Right column: decorative image */}
        <div
          role="img"
          aria-label="Colorful abstract wave decoration"
          style={{
            backgroundImage: 'url(/images/curved6.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '100%',
          }}
        />
      </main>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
