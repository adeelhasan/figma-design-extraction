'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Coins,
  Globe,
  FileText,
  ShoppingCart,
  ArrowRight,
  TrendingUp,
  Users,
  MousePointer,
  ShoppingBag,
  Package,
  ArrowUp,
  Bell,
  Code,
  CreditCard,
  Key,
  Plus,
  Minus,
  Wrench,
  Smartphone,
  Layout,
} from 'lucide-react';

/* ── Data from Dashboard.json ── */

const widgets = [
  {
    id: 'widget-1',
    label: "Today's Money",
    value: '$53,000',
    change: '55%',
    direction: 'up' as const,
    icon: Coins,
    iconVariant: '',
  },
  {
    id: 'widget-2',
    label: "Today's Users",
    value: '2,300',
    change: '20%',
    direction: 'up' as const,
    icon: Globe,
    iconVariant: 'info',
  },
  {
    id: 'widget-3',
    label: 'New Clients',
    value: '+3,462',
    change: '- 2%',
    direction: 'down' as const,
    icon: FileText,
    iconVariant: 'warning',
  },
  {
    id: 'widget-4',
    label: 'Sales',
    value: '$103,430',
    change: '5%',
    direction: 'up' as const,
    icon: ShoppingCart,
    iconVariant: 'error',
  },
];

const chartStats = [
  { label: 'Users', value: '3,6K', icon: Users, gradient: 'var(--gradient-primary)' },
  { label: 'Clicks', value: '2m', icon: MousePointer, gradient: 'var(--gradient-info)' },
  { label: 'Sales', value: '$772', icon: ShoppingBag, gradient: 'var(--gradient-warning)' },
  { label: 'Items', value: '82', icon: Package, gradient: 'var(--gradient-error)' },
];

const chartXLabels = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];
const salesXLabels = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const barHeights = ['35%', '55%', '40%', '70%', '60%', '85%', '65%', '75%', '50%'];

const tableRows = [
  {
    company: 'Soft UI Shopify Version',
    icon: ShoppingBag,
    logoBg: 'var(--gradient-dark)',
    members: 4,
    budget: '$14,000',
    completion: 60,
    completionLabel: '60%',
    barBg: 'var(--gradient-info)',
  },
  {
    company: 'Progress Track',
    icon: TrendingUp,
    logoBg: 'linear-gradient(216.2deg, #0052cc 0%, #2684ff 92%)',
    members: 3,
    budget: '$3,000',
    completion: 10,
    completionLabel: '10%',
    barBg: 'var(--gradient-info)',
  },
  {
    company: 'Fix Platform Errors',
    icon: Wrench,
    logoBg: 'var(--gradient-info)',
    members: 4,
    budget: 'Not Set',
    completion: 100,
    completionLabel: '100%',
    barBg: 'var(--gradient-success)',
  },
  {
    company: 'Launch new Mobile App',
    icon: Smartphone,
    logoBg: 'var(--gradient-warning)',
    members: 4,
    budget: '$20,600',
    completion: 100,
    completionLabel: '100%',
    barBg: 'var(--gradient-success)',
  },
  {
    company: 'Add the New Landing Page',
    icon: Layout,
    logoBg: 'linear-gradient(237.0deg, #0052cc 18%, #2684ff 100%)',
    members: 4,
    budget: '$4,000',
    completion: 80,
    completionLabel: '80%',
    barBg: 'var(--gradient-info)',
  },
  {
    company: 'Redesign Online Store',
    icon: ShoppingCart,
    logoBg: 'var(--gradient-primary)',
    members: 4,
    budget: '$2,000',
    completion: 0,
    completionLabel: 'cancel',
    barBg: 'var(--color-error)',
  },
];

const memberAvatars = [
  '/images/face-1.png',
  '/images/face-2.png',
  '/images/face-3.png',
  '/images/face-4.png',
];

const timelineItems = [
  {
    text: '$2,400 - Redesign store',
    time: '09 JUN 7:20 PM',
    gradient: 'success',
    icon: Bell,
  },
  {
    text: 'New order #3654323',
    time: '08 JUN 12:20 PM',
    gradient: 'error',
    icon: Code,
  },
  {
    text: 'Company server payments',
    time: '04 JUN 3:10 PM',
    gradient: 'info',
    icon: ShoppingCart,
  },
  {
    text: 'New card added for order #4826321',
    time: '02 JUN 2:45 PM',
    gradient: 'warning',
    icon: CreditCard,
  },
  {
    text: 'Unlock folders for development',
    time: '18 MAY 1:30 PM',
    gradient: 'primary',
    icon: Key,
  },
  {
    text: 'New order #46282344',
    time: '14 MAY 3:30 PM',
    gradient: 'dark',
    icon: Coins,
  },
];

const timelineGradientMap: Record<string, string> = {
  success: 'var(--gradient-success)',
  error: 'var(--gradient-error)',
  info: 'var(--gradient-info)',
  warning: 'var(--gradient-warning)',
  primary: 'var(--gradient-primary)',
  dark: 'var(--gradient-dark)',
};

const iconVariantMap: Record<string, string> = {
  '': 'var(--gradient-primary)',
  info: 'var(--gradient-info)',
  warning: 'var(--gradient-warning)',
  error: 'var(--gradient-error)',
};

/* ── Grid position map (from spec CSS Grid Template) ── */
const gridPositions: Record<string, React.CSSProperties> = {
  'widget-1': { gridColumn: '1 / 4', gridRow: '1 / 2' },
  'widget-2': { gridColumn: '4 / 7', gridRow: '1 / 2' },
  'widget-3': { gridColumn: '7 / 10', gridRow: '1 / 2' },
  'widget-4': { gridColumn: '10 / 13', gridRow: '1 / 2' },
  'card-1': { gridColumn: '1 / 8', gridRow: '2 / 3' },
  'card-2': { gridColumn: '8 / 13', gridRow: '2 / 3' },
  'chart-1': { gridColumn: '1 / 6', gridRow: '3 / 4' },
  'chart-2': { gridColumn: '6 / 13', gridRow: '3 / 4' },
  'table-1': { gridColumn: '1 / 9', gridRow: '4 / 5' },
  'timeline-1': { gridColumn: '9 / 13', gridRow: '4 / 5' },
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Page heading */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1
          style={{
            fontFamily: 'var(--font-family-secondary)',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          Dashboard
        </h1>
      </div>

      {/* Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'auto auto auto auto',
          gap: 'var(--spacing-6)',
        }}
      >
        {/* ── Row 1: Stat Widgets ── */}
        {widgets.map((w) => {
          const Icon = w.icon;
          return (
            <div key={w.id} style={{ ...gridPositions[w.id] }}>
              <div
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 'var(--spacing-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 100,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--spacing-1)',
                    }}
                  >
                    {w.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--spacing-1)',
                    }}
                  >
                    {w.value}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-bold)',
                      color:
                        w.direction === 'up'
                          ? 'var(--color-success)'
                          : 'var(--color-error)',
                    }}
                  >
                    {w.direction === 'up' ? (
                      <Plus style={{ width: 10, height: 10 }} />
                    ) : (
                      <Minus style={{ width: 10, height: 10 }} />
                    )}
                    {w.change}
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: iconVariantMap[w.iconVariant],
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: 'var(--shadow-sm), var(--shadow-md)',
                    marginLeft: 'var(--spacing-3)',
                  }}
                >
                  <Icon style={{ width: 20, height: 20, color: 'white' }} />
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Row 2: Promo Cards ── */}

        {/* Card-1: Built by developers */}
        <div style={{ ...gridPositions['card-1'] }}>
          <div
            style={{
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              height: '100%',
              minHeight: 277,
              background: 'var(--color-surface)',
            }}
          >
            <div
              style={{
                flex: 1,
                padding: 'var(--spacing-6)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Built by developers
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-secondary)',
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--spacing-3)',
                  }}
                >
                  Soft UI Dashboard
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-body)',
                    lineHeight: 'var(--line-height-normal)',
                    marginBottom: 'var(--spacing-4)',
                    flex: 1,
                  }}
                >
                  From colors, cards, typography to complex elements, you will find the
                  full documentation.
                </p>
              </div>
              <div>
                <a
                  href="#"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)',
                    textDecoration: 'none',
                  }}
                >
                  Read More
                  <ArrowRight style={{ width: 14, height: 14 }} />
                </a>
              </div>
            </div>
            <div
              style={{
                width: 220,
                flexShrink: 0,
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-card)',
                margin: 'var(--spacing-4)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/ivancik.png"
                alt="Soft UI Dashboard"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>

        {/* Card-2: Work with the rockets */}
        <div style={{ ...gridPositions['card-2'] }}>
          <div
            style={{
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              height: '100%',
              minHeight: 277,
              background: 'var(--color-surface)',
            }}
          >
            <div
              style={{
                width: '45%',
                background: 'var(--gradient-primary)',
                borderRadius: 'var(--radius-card)',
                margin: 'var(--spacing-4) 0 var(--spacing-4) var(--spacing-4)',
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/rocket-white.png"
                alt="Rocket"
                style={{
                  width: '80%',
                  height: 'auto',
                  objectFit: 'contain',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
            </div>
            <div
              style={{
                flex: 1,
                padding: 'var(--spacing-6)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-family-secondary)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-3)',
                }}
              >
                Work with the rockets
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-body)',
                  lineHeight: 'var(--line-height-normal)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                Wealth creation is an evolutionarily recent positive-sum game. It is all
                about who take the opportunity first.
              </p>
              <a
                href="#"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-2)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  textDecoration: 'none',
                }}
              >
                Read More
                <ArrowRight style={{ width: 14, height: 14 }} />
              </a>
            </div>
          </div>
        </div>

        {/* ── Row 3: Charts ── */}

        {/* Chart-1: Active Users */}
        <div style={{ ...gridPositions['chart-1'] }}>
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              padding: 'var(--spacing-6)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-secondary)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Active Users
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                    marginTop: 'var(--spacing-1)',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-1)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-success)',
                      fontWeight: 'var(--font-weight-bold)',
                    }}
                  >
                    <TrendingUp style={{ width: 12, height: 12 }} />
                    (+23%)
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-body)',
                    }}
                  >
                    than last week
                  </span>
                </div>
              </div>
            </div>

            {/* Bar chart area */}
            <div
              style={{
                flex: 1,
                background: 'var(--gradient-dark)',
                borderRadius: 'var(--radius-card)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 220,
                display: 'flex',
                alignItems: 'flex-end',
                padding: 'var(--spacing-4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-around',
                  width: '100%',
                  height: 180,
                  gap: 'var(--spacing-2)',
                }}
              >
                {barHeights.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: h,
                      background:
                        i === 5 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                      borderRadius: '4px 4px 0 0',
                      minWidth: 8,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* X-axis labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                marginTop: 'var(--spacing-2)',
              }}
            >
              {chartXLabels.map((label) => (
                <div
                  key={label}
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-2xs)',
                    color: 'var(--color-text-secondary)',
                    textAlign: 'center',
                    flex: 1,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Stats row */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-4)',
                marginTop: 'var(--spacing-4)',
                flexWrap: 'wrap',
              }}
            >
              {chartStats.map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        background: stat.gradient,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <StatIcon style={{ width: 12, height: 12, color: 'white' }} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-2xs)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {stat.label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart-2: Sales Overview */}
        <div style={{ ...gridPositions['chart-2'] }}>
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              padding: 'var(--spacing-6)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-secondary)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Sales Overview
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-2)',
                    marginTop: 'var(--spacing-1)',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-1)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-success)',
                      fontWeight: 'var(--font-weight-bold)',
                    }}
                  >
                    <TrendingUp style={{ width: 12, height: 12 }} />
                    4% more
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-body)',
                    }}
                  >
                    in 2021
                  </span>
                </div>
              </div>
            </div>

            {/* Line chart placeholder */}
            <div
              style={{
                flex: 1,
                minHeight: 280,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                viewBox="0 0 640 260"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
              >
                {/* Grid lines */}
                <line x1="0" y1="52" x2="640" y2="52" stroke="#e9ecef" strokeWidth="1" />
                <line x1="0" y1="104" x2="640" y2="104" stroke="#e9ecef" strokeWidth="1" />
                <line x1="0" y1="156" x2="640" y2="156" stroke="#e9ecef" strokeWidth="1" />
                <line x1="0" y1="208" x2="640" y2="208" stroke="#e9ecef" strokeWidth="1" />
                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="lineGrad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cb0c9f" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#cb0c9f" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#252f40" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#252f40" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Area fill primary */}
                <path
                  d="M40,200 L110,160 L180,180 L260,120 L340,100 L420,80 L500,60 L580,40 L620,50 L620,260 L40,260 Z"
                  fill="url(#lineGrad1)"
                />
                {/* Line primary */}
                <polyline
                  points="40,200 110,160 180,180 260,120 340,100 420,80 500,60 580,40 620,50"
                  fill="none"
                  stroke="#cb0c9f"
                  strokeWidth="2.5"
                />
                {/* Area fill secondary */}
                <path
                  d="M40,180 L110,190 L180,160 L260,150 L340,130 L420,110 L500,90 L580,70 L620,80 L620,260 L40,260 Z"
                  fill="url(#lineGrad2)"
                />
                {/* Line secondary */}
                <polyline
                  points="40,180 110,190 180,160 260,150 340,130 420,110 500,90 580,70 620,80"
                  fill="none"
                  stroke="#252f40"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* X-axis labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                marginTop: 'var(--spacing-2)',
              }}
            >
              {salesXLabels.map((label) => (
                <div
                  key={label}
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-2xs)',
                    color: 'var(--color-text-secondary)',
                    textAlign: 'center',
                    flex: 1,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 4: Table + Timeline ── */}

        {/* Table-1: Projects */}
        <div style={{ ...gridPositions['table-1'] }}>
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              padding: 'var(--spacing-6)',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--spacing-3)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-secondary)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Projects
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-2xs)',
                  color: 'var(--color-success)',
                  fontWeight: 'var(--font-weight-semibold)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <ArrowUp
                  style={{ width: 12, height: 12, display: 'inline' }}
                />
                40% done this month
              </span>
            </div>

            <table
              style={{ width: '100%', borderCollapse: 'collapse' }}
            >
              <thead>
                <tr>
                  {['COMPANIES', 'MEMBERS', 'BUDGET', 'COMPLETION'].map((col) => (
                    <th
                      key={col}
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-2xs)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        textAlign: 'left',
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, idx) => {
                  const RowIcon = row.icon;
                  const isLast = idx === tableRows.length - 1;
                  const isCancel = row.completionLabel === 'cancel';
                  return (
                    <tr key={row.company}>
                      <td
                        style={{
                          padding: 'var(--spacing-3)',
                          borderBottom: isLast
                            ? 'none'
                            : '1px solid var(--color-border)',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-3)',
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 'var(--radius-md)',
                              background: row.logoBg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <RowIcon
                              style={{ width: 14, height: 14, color: 'white' }}
                            />
                          </div>
                          <span
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {row.company}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: 'var(--spacing-3)',
                          borderBottom: isLast
                            ? 'none'
                            : '1px solid var(--color-border)',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div style={{ display: 'flex' }}>
                          {memberAvatars.slice(0, row.members).map((src, ai) => (
                            <div
                              key={ai}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                border: '2px solid var(--color-surface)',
                                marginLeft: ai === 0 ? 0 : -6,
                                overflow: 'hidden',
                                background: 'var(--color-background)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={src}
                                alt="member"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: 'var(--spacing-3)',
                          borderBottom: isLast
                            ? 'none'
                            : '1px solid var(--color-border)',
                          verticalAlign: 'middle',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {row.budget}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: 'var(--spacing-3)',
                          borderBottom: isLast
                            ? 'none'
                            : '1px solid var(--color-border)',
                          verticalAlign: 'middle',
                          minWidth: 100,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--font-size-2xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: isCancel
                              ? 'var(--color-error)'
                              : 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-1)',
                          }}
                        >
                          {row.completionLabel}
                        </div>
                        <div
                          style={{
                            height: 6,
                            background: 'var(--color-border)',
                            borderRadius: 'var(--radius-pill)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${row.completion}%`,
                              background: row.barBg,
                              borderRadius: 'var(--radius-pill)',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline-1: Orders History */}
        <div style={{ ...gridPositions['timeline-1'] }}>
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              padding: 'var(--spacing-6)',
              height: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-secondary)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Orders History
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-1)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-success)',
                  fontWeight: 'var(--font-weight-bold)',
                }}
              >
                <ArrowUp style={{ width: 12, height: 12 }} />
                24%
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-body)',
                }}
              >
                this month
              </span>
            </div>

            {/* Divider */}
            <div
              style={{
                width: '100%',
                height: 2,
                background: 'var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--spacing-4)',
              }}
            />

            {/* Timeline list */}
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {timelineItems.map((item, idx) => {
                const TimelineIcon = item.icon;
                const isLast = idx === timelineItems.length - 1;
                return (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 'var(--spacing-3)',
                      padding: 'var(--spacing-3) 0',
                      position: 'relative',
                    }}
                  >
                    {/* Connector line */}
                    {!isLast && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: 44,
                          bottom: -4,
                          width: 2,
                          background: 'var(--color-border)',
                        }}
                      />
                    )}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 1,
                        background: timelineGradientMap[item.gradient],
                      }}
                    >
                      <TimelineIcon
                        style={{ width: 12, height: 12, color: 'white' }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {item.text}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-2xs)',
                          color: 'var(--color-text-secondary)',
                          marginTop: 2,
                        }}
                      >
                        {item.time}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
