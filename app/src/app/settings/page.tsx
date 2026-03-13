'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/Input';
import { Pencil } from 'lucide-react';

/* ── Toggle Switch ── */

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      style={{
        width: 34,
        height: 21,
        borderRadius: 10.5,
        flexShrink: 0,
        position: 'relative',
        cursor: 'pointer',
        background: enabled ? 'var(--gradient-primary)' : 'var(--color-border)',
        border: 'none',
        padding: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2.5,
          left: enabled ? 15 : 2.5,
          width: 16,
          height: 16,
          borderRadius: 8,
          background: 'var(--color-surface)',
          boxShadow:
            '0px 2px 4px -1px rgba(0,0,0,0.07), 0px 4px 6px -1px rgba(0,0,0,0.12)',
          transition: 'left 0.2s ease',
        }}
      />
    </button>
  );
}

/* ── Card Style ── */

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 12,
  boxShadow: '0px 20px 27px rgba(0, 0, 0, 0.05)',
  padding: 'var(--spacing-6)',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-family-primary)',
  fontSize: 'var(--font-size-base)',
  fontWeight: 'var(--font-weight-semibold)' as never,
  color: 'var(--color-text-primary)',
  margin: 0,
  marginBottom: 'var(--spacing-4)',
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-primary)',
  fontSize: 'var(--font-size-2xs)',
  fontWeight: 'var(--font-weight-bold)' as never,
  color: 'var(--color-text-secondary)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: 'var(--spacing-3)',
};

/* ── Settings Page ── */

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weeklyDigest: false,
    mentions: true,
    updates: true,
    marketing: false,
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    loginAlerts: true,
    sessionTimeout: true,
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSecurity = (key: keyof typeof security) => {
    setSecurity((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <DashboardLayout>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 'var(--spacing-6)',
        }}
      >
        {/* Header */}
        <section style={{ gridColumn: '1 / 13' }}>
          <h4
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)' as never,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Settings
          </h4>
        </section>

        {/* Left Column: Account Info */}
        <section style={{ gridColumn: '1 / 8', ...cardStyle }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            <h6 style={sectionTitle}>Basic Information</h6>
            <Pencil
              size={14}
              style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--spacing-4)',
            }}
          >
            <Input label="First Name" placeholder="Alec" />
            <Input label="Last Name" placeholder="Thompson" />
            <Input label="Email" type="email" placeholder="alec@example.com" />
            <Input label="Phone" placeholder="(44) 123 1234 123" />
            <div style={{ gridColumn: '1 / 3' }}>
              <Input label="Location" placeholder="Bucharest, Romania" />
            </div>
          </div>

          <div style={{ marginTop: 'var(--spacing-6)' }}>
            <button
              type="button"
              style={{
                display: 'inline-block',
                height: 40,
                background: 'var(--gradient-dark)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                boxShadow:
                  '0px 2px 4px -1px rgba(0,0,0,0.07), 0px 4px 6px -1px rgba(0,0,0,0.12)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-bold)' as never,
                color: 'var(--color-surface)',
                textTransform: 'uppercase',
                letterSpacing: '-0.025em',
                cursor: 'pointer',
                padding: '0 var(--spacing-6)',
              }}
            >
              UPDATE PROFILE
            </button>
          </div>
        </section>

        {/* Right Column: Notifications */}
        <section style={{ gridColumn: '8 / 13', ...cardStyle }}>
          <h6 style={sectionTitle}>Notifications</h6>

          <div style={labelStyle}>EMAIL</div>
          {[
            {
              key: 'email' as const,
              text: 'Email me when someone follows me',
            },
            {
              key: 'mentions' as const,
              text: 'Email me when someone mentions me',
            },
            {
              key: 'weeklyDigest' as const,
              text: 'Weekly activity digest',
            },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <ToggleSwitch
                enabled={notifications[item.key]}
                onToggle={() => toggleNotification(item.key)}
              />
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {item.text}
              </span>
            </div>
          ))}

          <div style={{ ...labelStyle, marginTop: 'var(--spacing-4)' }}>
            PUSH
          </div>
          {[
            { key: 'push' as const, text: 'Push notifications' },
            {
              key: 'updates' as const,
              text: 'Product updates and announcements',
            },
            { key: 'marketing' as const, text: 'Marketing and promotions' },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <ToggleSwitch
                enabled={notifications[item.key]}
                onToggle={() => toggleNotification(item.key)}
              />
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </section>

        {/* Security */}
        <section style={{ gridColumn: '1 / 7', ...cardStyle }}>
          <h6 style={sectionTitle}>Security</h6>

          {[
            {
              key: 'twoFactor' as const,
              text: 'Two-factor authentication',
              desc: 'Add an extra layer of security to your account',
            },
            {
              key: 'loginAlerts' as const,
              text: 'Login alerts',
              desc: 'Get notified when a new device logs into your account',
            },
            {
              key: 'sessionTimeout' as const,
              text: 'Auto session timeout',
              desc: 'Automatically log out after 30 minutes of inactivity',
            },
          ].map((item, idx, arr) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-3)',
                paddingBottom:
                  idx === arr.length - 1 ? 0 : 'var(--spacing-4)',
                marginBottom:
                  idx === arr.length - 1 ? 0 : 'var(--spacing-4)',
                borderBottom:
                  idx === arr.length - 1
                    ? 'none'
                    : '1px solid var(--color-border)',
              }}
            >
              <ToggleSwitch
                enabled={security[item.key]}
                onToggle={() => toggleSecurity(item.key)}
              />
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)' as never,
                    color: 'var(--color-text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {item.text}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-2xs)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Password Change */}
        <section style={{ gridColumn: '7 / 13', ...cardStyle }}>
          <h6 style={sectionTitle}>Change Password</h6>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-4)',
            }}
          >
            <Input
              label="Current Password"
              type="password"
              placeholder="Current password"
            />
            <Input
              label="New Password"
              type="password"
              placeholder="New password"
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
            />
          </div>

          <div style={{ marginTop: 'var(--spacing-6)' }}>
            <button
              type="button"
              style={{
                display: 'inline-block',
                height: 40,
                background: 'var(--gradient-info)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                boxShadow:
                  '0px 2px 4px -1px rgba(0,0,0,0.07), 0px 4px 6px -1px rgba(0,0,0,0.12)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-bold)' as never,
                color: 'var(--color-surface)',
                textTransform: 'uppercase',
                letterSpacing: '-0.025em',
                cursor: 'pointer',
                padding: '0 var(--spacing-6)',
              }}
            >
              UPDATE PASSWORD
            </button>
          </div>
        </section>

        {/* Delete Account */}
        <section style={{ gridColumn: '1 / 13', ...cardStyle }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h6
                style={{
                  ...sectionTitle,
                  color: 'var(--color-error)',
                  marginBottom: 'var(--spacing-1)',
                }}
              >
                Delete Account
              </h6>
              <p
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                  margin: 0,
                }}
              >
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
            </div>
            <button
              type="button"
              style={{
                height: 40,
                background: 'transparent',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-bold)' as never,
                color: 'var(--color-error)',
                textTransform: 'uppercase',
                letterSpacing: '-0.025em',
                cursor: 'pointer',
                padding: '0 var(--spacing-6)',
              }}
            >
              DELETE ACCOUNT
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
