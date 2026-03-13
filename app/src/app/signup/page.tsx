'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthNavbar } from '@/components/layout/AuthNavbar';
import { AuthFooter } from '@/components/layout/AuthFooter';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sign up:', { name, email, password, agreed });
  };

  return (
    <div
      style={{
        fontFamily: 'var(--font-family-primary)',
        background: 'var(--color-background)',
        color: 'var(--color-text-primary)',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {/* Navbar */}
      <AuthNavbar />

      {/* Hero Section */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 1408,
          height: 549,
          margin: '16px auto 0',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundImage: 'url(/images/bg-signup.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--gradient-dark)',
            opacity: 0.75,
            borderRadius: 12,
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 48,
            zIndex: 1,
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: '3rem',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-surface)',
              letterSpacing: '-0.083em',
              lineHeight: 1.17,
              textAlign: 'center',
              marginBottom: 'var(--spacing-3)',
            }}
          >
            Sign Up
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--color-surface)',
              textAlign: 'center',
              maxWidth: 480,
              lineHeight: 1.5625,
              letterSpacing: '-0.025em',
            }}
          >
            Use these awesome forms to login or create new account in your project for free.
          </p>
        </div>
      </div>

      {/* Registration Form Card (overlaps hero bottom) */}
      <div
        style={{
          position: 'relative',
          width: 409,
          margin: '-172px auto 0',
          background: 'var(--color-surface)',
          borderRadius: 12,
          boxShadow: '0px 20px 27px rgba(0, 0, 0, 0.05)',
          padding: 'var(--spacing-8) var(--spacing-6)',
          zIndex: 2,
        }}
      >
        {/* Heading */}
        <h5
          style={{
            fontFamily: 'var(--font-family-primary)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            textAlign: 'center',
            marginBottom: 'var(--spacing-4)',
            letterSpacing: '-0.031em',
          }}
        >
          Register with
        </h5>

        {/* Social Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--spacing-2)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          {/* Facebook */}
          <a
            href="#"
            aria-label="Sign up with Facebook"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 76,
              height: 56,
              background: 'rgba(255, 255, 255, 0.20)',
              border: '1px solid var(--color-text-secondary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#344e86"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
          </a>

          {/* Apple */}
          <a
            href="#"
            aria-label="Sign up with Apple"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 76,
              height: 56,
              background: 'rgba(255, 255, 255, 0.20)',
              border: '1px solid var(--color-text-secondary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#000000">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
            </svg>
          </a>

          {/* Google */}
          <a
            href="#"
            aria-label="Sign up with Google"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 76,
              height: 56,
              background: 'rgba(255, 255, 255, 0.20)',
              border: '1px solid var(--color-text-secondary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" />
              <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z" />
              <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
            </svg>
          </a>
        </div>

        {/* OR separator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-secondary)',
            }}
          >
            or
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        {/* Input Fields */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-3)' }}>
            <Input
              type="text"
              placeholder="Name"
              aria-label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 'var(--spacing-3)' }}>
            <Input
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <Input
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Checkbox */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            <Checkbox
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              label=""
            />
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-regular)',
                color: 'var(--color-text-primary)',
              }}
            >
              I agree the{' '}
              <a
                href="#"
                style={{
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  textDecoration: 'none',
                }}
              >
                Terms and Conditions
              </a>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              display: 'block',
              width: '100%',
              height: 40,
              background: 'var(--gradient-dark)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0px 2px 4px -1px rgba(0, 0, 0, 0.07), 0px 4px 6px -1px rgba(0, 0, 0, 0.12)',
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-surface)',
              textTransform: 'uppercase',
              letterSpacing: '-0.025em',
              cursor: 'pointer',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            SIGN UP
          </button>
        </form>

        {/* Footer sign-in link */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--spacing-1)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-regular)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Already have an account?
          </span>
          <Link
            href="/signin"
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
            }}
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Spacer between form card bottom and footer */}
      <div style={{ height: 64 }} />

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
