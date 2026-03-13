'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Wifi,
  Landmark,
  CreditCard,
  FileText,
  Pencil,
  Trash2,
  Calendar,
  Minus,
  Plus,
  AlertCircle,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Data (from Billing.json)                                            */
/* ------------------------------------------------------------------ */

const creditCard = {
  cardNumber: ['4562', '1122', '4594', '7852'],
  cardHolder: 'Jack Peterson',
  expires: '11/22',
  cardHolderLabel: 'Card Holder',
  expiresLabel: 'Expires',
};

const miniCards = [
  { title: 'Salary', subtitle: 'Belong Interactive', amount: '+$2,000', icon: Landmark },
  { title: 'Paypal', subtitle: 'Freelance Payment', amount: '$49,000', icon: CreditCard },
];

const paymentMethod = {
  title: 'Payment Method',
  buttonLabel: 'ADD NEW CARD',
  cards: [
    { type: 'mastercard' as const, digits: ['****', '****', '****', '7362'] },
    { type: 'visa' as const, digits: ['****', '****', '****', '3288'] },
  ],
};

const invoicesData = {
  title: 'Invoices',
  viewAllLabel: 'VIEW ALL',
  items: [
    { id: '#MS-415646', date: 'March, 01, 2021', amount: '$180', type: 'PDF' },
    { id: '#RV-126749', date: 'February, 12, 2021', amount: '$250', type: 'PDF' },
    { id: '#FB-212562', date: 'April, 05, 2020', amount: '$550', type: 'PDF' },
    { id: '#QW-103578', date: 'June, 25, 2019', amount: '$400', type: 'PDF' },
    { id: '#AR-803481', date: 'March, 03, 2019', amount: '$700', type: 'PDF' },
  ],
};

const billingInfo = {
  title: 'Billing Information',
  cards: [
    {
      name: 'Oliver Liam',
      companyLabel: 'Company Name:',
      company: 'Viking Burrito',
      emailLabel: 'Email Address: ',
      email: 'oliver@burrito.com',
      vatLabel: 'VAT Number:',
      vat: 'FRB1235476',
    },
    {
      name: 'Lucas Harper',
      companyLabel: 'Company Name:',
      company: 'Stone Tech Zone',
      emailLabel: 'Email Address: ',
      email: 'lucas@syone-tech.com',
      vatLabel: 'VAT Number:',
      vat: 'FRB1235476',
    },
    {
      name: 'Ethan James',
      companyLabel: 'Company Name:',
      company: 'Fiber Notion',
      emailLabel: 'Email Address: ',
      email: 'ethan@fiber.com',
      vatLabel: 'VAT Number:',
      vat: 'FRB1235476',
    },
  ],
};

const yourTransactions = {
  title: 'Your Transactions',
  dateRange: '23 - 30 March 2021',
  groups: [
    {
      label: 'NEWEST',
      transactions: [
        { name: 'Netflix', date: '27 March 2021, at 12:30 PM', amount: '- $2,500', type: 'debit' as const },
        { name: 'Apple', date: '27 March 2021, at 04:30 AM', amount: '+ $2,000', type: 'credit' as const },
      ],
    },
    {
      label: 'YESTERDAY',
      transactions: [
        { name: 'Stripe', date: '26 March 2021, at 12:30 AM', amount: '+ $750', type: 'credit' as const },
        { name: 'HubSpot', date: '26 March 2021, at 11:30 AM', amount: '+ $1,050', type: 'credit' as const },
        { name: 'Creative Tim', date: '26 March 2021, at 07:30 AM', amount: '+ $2,400', type: 'credit' as const },
        { name: 'Webflow', date: '26 March 2021, at 04:00 AM', amount: 'Pending', type: 'pending' as const },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function MastercardLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eb001b' }} />
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f79e1b', marginLeft: -8 }} />
    </div>
  );
}

function VisaLogo() {
  return (
    <div
      style={{
        flexShrink: 0,
        fontFamily: 'serif',
        fontSize: 18,
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: '#1a1f71',
        letterSpacing: -1,
        width: 44,
      }}
    >
      VISA
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function BillingPage() {
  return (
    <DashboardLayout>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: '245px 205px auto',
          gap: 'var(--spacing-6)',
        }}
      >
        {/* ── Credit Card Section (cols 1-7, row 1) ── */}
        <section
          style={{
            gridColumn: '1 / 8',
            gridRow: '1 / 2',
            display: 'flex',
            gap: 'var(--spacing-4)',
          }}
        >
          {/* Dark gradient credit card */}
          <div
            style={{
              flex: '0 0 calc(50% - var(--spacing-2))',
              background: 'var(--gradient-dark)',
              borderRadius: 12,
              padding: 'var(--spacing-4) var(--spacing-6)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 221,
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -40,
                left: -20,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.04)',
              }}
            />

            {/* Wifi icon */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
              <Wifi style={{ width: 22, height: 22, color: 'white', opacity: 0.9 }} />
            </div>

            {/* Card number */}
            <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
              {creditCard.cardNumber.map((group, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'white',
                    letterSpacing: '0.05em',
                  }}
                >
                  {group}
                </span>
              ))}
            </div>

            {/* Bottom: holder + expiry + logo */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: 'var(--spacing-1)',
                  }}
                >
                  {creditCard.cardHolderLabel}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'white',
                  }}
                >
                  {creditCard.cardHolder}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-regular)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: 'var(--spacing-1)',
                  }}
                >
                  {creditCard.expiresLabel}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'white',
                  }}
                >
                  {creditCard.expires}
                </div>
              </div>
              {/* Mastercard logo on card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eb001b', opacity: 0.9 }} />
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f79e1b', opacity: 0.9, marginLeft: -10 }} />
              </div>
            </div>
          </div>

          {/* Mini stat cards */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {miniCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  style={{
                    flex: 1,
                    background: 'var(--color-surface)',
                    borderRadius: 12,
                    boxShadow: '0 20px 27px rgba(0, 0, 0, 0.05)',
                    padding: 'var(--spacing-3) var(--spacing-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-3)',
                    position: 'relative',
                  }}
                >
                  {/* Bottom border line */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 'var(--spacing-4)',
                      right: 'var(--spacing-4)',
                      height: 1,
                      background: 'var(--gray-light-alt)',
                    }}
                  />
                  {/* Gradient icon */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      background: 'var(--gradient-primary)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 2px 4px -1px rgba(0,0,0,0.07), 0 4px 6px -1px rgba(0,0,0,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: 20, height: 20, color: 'white' }} />
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-2xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-body)',
                      }}
                    >
                      {card.subtitle}
                    </div>
                  </div>
                  {/* Amount */}
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {card.amount}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Invoices (cols 8-12, rows 1-2) ── */}
        <section style={{ gridColumn: '8 / 13', gridRow: '1 / 3' }}>
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 12,
              boxShadow: '0 20px 27px rgba(0, 0, 0, 0.05)',
              padding: 'var(--spacing-6)',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {invoicesData.title}
              </span>
              <button
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-2xs)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  boxShadow: '0 2px 4px -0.5px rgba(0,0,0,0.07), 0 4px 6px -0.5px rgba(0,0,0,0.12)',
                }}
              >
                {invoicesData.viewAllLabel}
              </button>
            </div>

            {/* Invoice rows */}
            {invoicesData.items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-3)',
                  padding: 'var(--spacing-3) 0',
                  borderBottom: i < invoicesData.items.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}
              >
                <FileText style={{ color: 'var(--color-error)', width: 18, height: 18, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {item.date}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-2xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-body)',
                    }}
                  >
                    {item.id}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {item.amount}
                </div>
                <a
                  href="#"
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-body)',
                    textDecoration: 'none',
                    padding: 'var(--spacing-1) var(--spacing-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {item.type}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ── Payment Method (cols 1-7, row 2) ── */}
        <section style={{ gridColumn: '1 / 8', gridRow: '2 / 3' }}>
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 12,
              boxShadow: '0 20px 27px rgba(0, 0, 0, 0.05)',
              padding: 'var(--spacing-4) var(--spacing-6) var(--spacing-6)',
              height: '100%',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {paymentMethod.title}
              </span>
              <button
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-2xs)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'white',
                  background: 'var(--gradient-dark)',
                  border: 'none',
                  borderRadius: 6,
                  padding: 'var(--spacing-2) var(--spacing-4)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  boxShadow: '0 2px 4px -1px rgba(0,0,0,0.12), 0 4px 6px -1px rgba(0,0,0,0.12)',
                  whiteSpace: 'nowrap',
                }}
              >
                {paymentMethod.buttonLabel}
              </button>
            </div>

            {/* Saved cards */}
            <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
              {paymentMethod.cards.map((card) => (
                <div
                  key={card.digits[3]}
                  style={{
                    flex: 1,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--gray-light-alt)',
                    borderRadius: 12,
                    padding: 'var(--spacing-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-3)',
                  }}
                >
                  {card.type === 'mastercard' ? <MastercardLogo /> : <VisaLogo />}
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      gap: 'var(--spacing-2)',
                      alignItems: 'center',
                    }}
                  >
                    {card.digits.map((d, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-primary)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                  <button
                    style={{
                      color: 'var(--color-text-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 'var(--spacing-1)',
                    }}
                  >
                    <Pencil style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Billing Information (cols 1-8, row 3) ── */}
        <section style={{ gridColumn: '1 / 9', gridRow: '3 / 4', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              flex: 1,
              background: 'var(--color-surface)',
              borderRadius: 12,
              boxShadow: '0 20px 27px rgba(0, 0, 0, 0.05)',
              padding: 'var(--spacing-6)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {billingInfo.title}
              </span>
            </div>

            {/* Contact cards */}
            {billingInfo.cards.map((contact, i) => (
              <div
                key={contact.name}
                style={{
                  background: 'var(--color-background)',
                  borderRadius: 12,
                  padding: 'var(--spacing-4)',
                  marginBottom: i < billingInfo.cards.length - 1 ? 'var(--spacing-4)' : 0,
                }}
              >
                {/* Contact header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-3)',
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
                    {contact.name}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <button
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-2xs)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-error)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-1)',
                      }}
                    >
                      <Trash2 style={{ width: 12, height: 12 }} />
                      DELETE
                    </button>
                    <button
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-2xs)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-text-primary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-1)',
                      }}
                    >
                      <Pencil style={{ width: 12, height: 12 }} />
                      EDIT
                    </button>
                  </div>
                </div>

                {/* Fields grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--spacing-2) var(--spacing-4)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--color-body)',
                      }}
                    >
                      {contact.companyLabel}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {contact.company}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--color-body)',
                      }}
                    >
                      {contact.emailLabel}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {contact.email}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-regular)',
                        color: 'var(--color-body)',
                      }}
                    >
                      {contact.vatLabel}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {contact.vat}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Your Transactions (cols 9-12, row 3) ── */}
        <section style={{ gridColumn: '9 / 13', gridRow: '3 / 4', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              flex: 1,
              background: 'var(--color-surface)',
              borderRadius: 12,
              boxShadow: '0 20px 27px rgba(0, 0, 0, 0.05)',
              padding: 'var(--spacing-6)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {yourTransactions.title}
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-1)',
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-regular)',
                  color: 'var(--color-body)',
                }}
              >
                <Calendar style={{ width: 14, height: 14, color: 'var(--color-body)' }} />
                <span>{yourTransactions.dateRange}</span>
              </div>
            </div>

            {/* Transaction groups */}
            {yourTransactions.groups.map((group) => (
              <div key={group.label}>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-2xs)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-body)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    margin: 'var(--spacing-3) 0 var(--spacing-2)',
                  }}
                >
                  {group.label}
                </div>

                {group.transactions.map((tx) => {
                  const iconColor =
                    tx.type === 'debit'
                      ? 'var(--color-error)'
                      : tx.type === 'credit'
                        ? 'var(--color-success)'
                        : 'var(--color-text-primary)';

                  const TxIcon =
                    tx.type === 'debit' ? Minus : tx.type === 'credit' ? Plus : AlertCircle;

                  const amountStyle: React.CSSProperties =
                    tx.type === 'debit'
                      ? {
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-base)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--color-error)',
                          textAlign: 'right',
                        }
                      : tx.type === 'credit'
                        ? {
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--font-size-base)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-success)',
                            textAlign: 'right',
                          }
                        : {
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-body)',
                            textAlign: 'right',
                          };

                  return (
                    <div
                      key={tx.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-3)',
                        padding: 'var(--spacing-2) 0',
                      }}
                    >
                      {/* Icon circle */}
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: `1px solid ${iconColor}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <TxIcon style={{ width: 12, height: 12, color: iconColor }} />
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 2,
                          }}
                        >
                          {tx.name}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--font-size-2xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-body)',
                          }}
                        >
                          {tx.date}
                        </div>
                      </div>
                      {/* Amount */}
                      <div style={amountStyle}>{tx.amount}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
