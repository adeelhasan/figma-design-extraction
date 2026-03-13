'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  LayoutGrid,
  FileText,
  Settings,
  Pencil,
  Facebook,
  Twitter,
  Instagram,
  CloudUpload,
} from 'lucide-react';

/* ── Data from Profile.json ── */

const profileIdentity = {
  avatar: '/images/bruce-mars.png',
  name: 'Alec Thompson',
  title: 'CEO / Co-Founder',
  tabs: ['Overview', 'Teams', 'Projects'] as const,
  activeTab: 'Overview',
};

const tabIcons: Record<string, React.ElementType> = {
  Overview: LayoutGrid,
  Teams: FileText,
  Projects: Settings,
};

const platformSettings = {
  title: 'Platform Settings',
  groups: [
    {
      label: 'ACCOUNT',
      items: [
        { text: 'Email me when someone follows me', enabled: true },
        { text: 'Email me when someone answers me', enabled: false },
        { text: 'Email me when someone mentions me', enabled: true },
      ],
    },
    {
      label: 'APPLICATION',
      items: [
        { text: 'New launches and projects', enabled: true },
        { text: 'Monthly product updates', enabled: false },
        { text: 'Subscribe to newsletter', enabled: true },
      ],
    },
  ],
};

const profileInformation = {
  title: 'Profile Information',
  bio: "Hi, I'm Alec Thompson, Decisions: If you can't decide, the answer is no. If two equally difficult paths, choose the one more painful in the short term (pain avoidance is creating an illusion of equality).",
  fields: [
    { label: 'Full Name:', value: 'Sarah Emily Jacob' },
    { label: 'Mobile:', value: '(44) 123 1234 123' },
    { label: 'Email:', value: 'sarahjacob@mail.com' },
    { label: 'Location:', value: 'USA' },
  ],
  social: ['facebook', 'twitter', 'instagram'] as const,
};

const conversations = [
  { name: 'Sophie B.', message: 'Hi! I need more information\u2026', avatar: '/images/face-3.png' },
  { name: 'Anne Marie', message: 'Awesome work, can you\u2026', avatar: '/images/face-4.png' },
  { name: 'Ivan', message: 'About files I can\u2026', avatar: '/images/face-5.png' },
  { name: 'Peterson', message: 'Have a great afternoon\u2026', avatar: '/images/face-6.png' },
  { name: 'Nick Daniel', message: 'Hi! I need more information\u2026', avatar: '/images/face-2.png' },
];

const projects = [
  {
    label: 'Project #1',
    title: 'Modern',
    description: 'As Uber works through a huge amount of internal management turmoil.',
    image: '/images/home-decor-2.png',
    members: ['/images/face-1.png', '/images/face-4.png', '/images/face-2.png', '/images/face-3.png'],
  },
  {
    label: 'Project #2',
    title: 'Scandinavian',
    description: 'Music is something that every person has his or her own specific opinion about.',
    image: '/images/home-decor-3.png',
    members: ['/images/face-1.png', '/images/face-4.png', '/images/face-2.png', '/images/face-3.png'],
  },
  {
    label: 'Project #3',
    title: 'Minimalist',
    description: 'Different people have different taste, and various types of music, Zimbali Coastal Resort',
    image: '/images/ivancik.png',
    members: ['/images/face-1.png', '/images/face-4.png', '/images/face-2.png', '/images/face-3.png'],
  },
];

/* ── Toggle Switch Component ── */

function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <div
      style={{
        width: 34,
        height: 21,
        borderRadius: 10.5,
        flexShrink: 0,
        position: 'relative',
        cursor: 'pointer',
        background: enabled ? 'var(--gradient-primary)' : 'var(--color-border)',
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
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.07), 0px 4px 6px -1px rgba(0,0,0,0.12)',
        }}
      />
    </div>
  );
}

/* ── Social Icon Component ── */

function SocialIcon({ platform }: { platform: 'facebook' | 'twitter' | 'instagram' }) {
  const bgMap: Record<string, string> = {
    facebook: '#3b5998',
    twitter: '#1da1f2',
    instagram: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
  };
  const IconMap: Record<string, React.ElementType> = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
  };
  const Icon = IconMap[platform];

  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgMap[platform],
        color: 'white',
        cursor: 'pointer',
      }}
    >
      <Icon size={13} />
    </div>
  );
}

/* ── Card Style ── */

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 12,
  boxShadow: '0px 20px 27px rgba(0, 0, 0, 0.05)',
  padding: 'var(--spacing-6)',
};

/* ── Profile Page ── */

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'auto auto auto auto',
          gap: 'var(--spacing-6)',
        }}
      >
        {/* Row 1: Profile Header Banner */}
        <section style={{ gridColumn: '1 / 13', gridRow: '1 / 2' }}>
          <div
            style={{
              height: 230,
              borderRadius: 12,
              boxShadow: 'var(--shadow-lg)',
              backgroundImage: 'url(/images/curved14.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--gradient-primary)',
                opacity: 0.5,
                borderRadius: 12,
              }}
            />
          </div>
        </section>

        {/* Row 2: Profile Identity Bar */}
        <section style={{ gridColumn: '1 / 13', gridRow: '2 / 3' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(27px)',
              WebkitBackdropFilter: 'blur(27px)',
              borderRadius: 12,
              boxShadow: '0px 20px 27px rgba(0, 0, 0, 0.05)',
              padding: 'var(--spacing-4) var(--spacing-6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left: Avatar + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
              <div
                style={{
                  width: 74,
                  height: 81,
                  borderRadius: 8,
                  overflow: 'hidden',
                  boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.12)',
                  flexShrink: 0,
                }}
              >
                <img
                  src={profileIdentity.avatar}
                  alt={profileIdentity.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div>
                <h4
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '1.5rem',
                    fontWeight: 'var(--font-weight-semibold)' as never,
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.17,
                    margin: 0,
                  }}
                >
                  {profileIdentity.name}
                </h4>
                <p
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)' as never,
                    color: 'var(--color-text-muted)',
                    marginTop: 2,
                    marginBottom: 0,
                  }}
                >
                  {profileIdentity.title}
                </p>
              </div>
            </div>

            {/* Right: Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)' }}>
              {profileIdentity.tabs.map((tab) => {
                const Icon = tabIcons[tab];
                const isActive = tab === profileIdentity.activeTab;
                return (
                  <a
                    key={tab}
                    href="#"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-2)',
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)' as never,
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      ...(isActive
                        ? {
                            background: 'var(--color-surface)',
                            borderRadius: 8,
                            padding: 'var(--spacing-2) var(--spacing-3)',
                            boxShadow:
                              '0px 2px 4px -1px rgba(0,0,0,0.07), 0px 4px 6px -1px rgba(0,0,0,0.12)',
                          }
                        : {}),
                    }}
                  >
                    <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
                    {tab}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Row 3 Col 1-4: Platform Settings */}
        <section style={{ gridColumn: '1 / 5', gridRow: '3 / 4', ...cardStyle }}>
          <h6
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)' as never,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-4)',
              marginTop: 0,
            }}
          >
            {platformSettings.title}
          </h6>

          {platformSettings.groups.map((group, gi) => (
            <div key={group.label}>
              <div
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-2xs)',
                  fontWeight: 'var(--font-weight-bold)' as never,
                  color: 'var(--color-text-secondary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginTop: gi === 0 ? 0 : 'var(--spacing-4)',
                  marginBottom: 'var(--spacing-3)',
                }}
              >
                {group.label}
              </div>
              {group.items.map((item) => (
                <div
                  key={item.text}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-3)',
                    marginBottom: 'var(--spacing-4)',
                  }}
                >
                  <ToggleSwitch enabled={item.enabled} />
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
            </div>
          ))}
        </section>

        {/* Row 3 Col 5-8: Profile Information */}
        <section style={{ gridColumn: '5 / 9', gridRow: '3 / 4', ...cardStyle }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-4)',
            }}
          >
            <h6
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)' as never,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {profileInformation.title}
            </h6>
            <Pencil size={14} style={{ color: 'var(--color-text-muted)', cursor: 'pointer' }} />
          </div>

          <p
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
              marginBottom: 'var(--spacing-4)',
              marginTop: 0,
            }}
          >
            {profileInformation.bio}
          </p>

          <hr
            style={{
              border: 'none',
              borderBottom: '1px solid var(--gray-200, #f0f0f0)',
              marginBottom: 'var(--spacing-4)',
            }}
          />

          {profileInformation.fields.map((field) => (
            <div
              key={field.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-3)',
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              <span
                style={{
                  fontWeight: 'var(--font-weight-semibold)' as never,
                  color: 'var(--color-text-primary)',
                  minWidth: 80,
                }}
              >
                {field.label}
              </span>
              <span
                style={{
                  fontWeight: 'var(--font-weight-semibold)' as never,
                  color: 'var(--color-text-muted)',
                }}
              >
                {field.value}
              </span>
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-3)',
              marginTop: 'var(--spacing-3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)' as never,
                color: 'var(--color-text-primary)',
                minWidth: 80,
              }}
            >
              Social:
            </span>
            {profileInformation.social.map((platform) => (
              <SocialIcon key={platform} platform={platform} />
            ))}
          </div>
        </section>

        {/* Row 3 Col 9-12: Conversations */}
        <section style={{ gridColumn: '9 / 13', gridRow: '3 / 4', ...cardStyle }}>
          <h6
            style={{
              fontFamily: 'var(--font-family-primary)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)' as never,
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--spacing-4)',
              marginTop: 0,
            }}
          >
            Conversations
          </h6>

          {conversations.map((convo, idx) => (
            <div
              key={convo.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-3)',
                paddingBottom: idx === conversations.length - 1 ? 0 : 'var(--spacing-4)',
                marginBottom: idx === conversations.length - 1 ? 0 : 'var(--spacing-4)',
                borderBottom:
                  idx === conversations.length - 1
                    ? 'none'
                    : '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  width: 49,
                  height: 49,
                  borderRadius: 10.5,
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow:
                    '0px 2px 4px -1px rgba(0,0,0,0.07), 0px 4px 6px -1px rgba(0,0,0,0.12)',
                }}
              >
                <img
                  src={convo.avatar}
                  alt={convo.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)' as never,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {convo.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-2xs)',
                    color: 'var(--color-text-muted)',
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {convo.message}
                </div>
              </div>
              <button
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-2xs)',
                  fontWeight: 'var(--font-weight-bold)' as never,
                  color: 'var(--color-text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                REPLY
              </button>
            </div>
          ))}
        </section>

        {/* Row 4: Projects */}
        <section style={{ gridColumn: '1 / 13', gridRow: '4 / 5', ...cardStyle }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--spacing-3)',
              marginBottom: 'var(--spacing-6)',
            }}
          >
            <h6
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)' as never,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              Projects
            </h6>
            <span
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Architects design houses
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'var(--spacing-6)',
            }}
          >
            {projects.map((project) => (
              <div
                key={project.title}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}
              >
                <div
                  style={{
                    width: '100%',
                    height: 160,
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow:
                      '0px 2px 4px -1px rgba(0,0,0,0.07), 0px 4px 6px -1px rgba(0,0,0,0.12)',
                  }}
                >
                  <img
                    src={project.image}
                    alt={`${project.title} project image`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)' as never,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {project.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '1.25rem',
                    fontWeight: 'var(--font-weight-semibold)' as never,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {project.title}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  {project.description}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                  }}
                >
                  <button
                    style={{
                      fontFamily: 'var(--font-family-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-bold)' as never,
                      color: 'var(--color-primary)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-primary)',
                      borderRadius: 6,
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      cursor: 'pointer',
                      boxShadow:
                        '0px 2px 4px -1px rgba(0,0,0,0.07), 0px 4px 6px -1px rgba(0,0,0,0.12)',
                    }}
                  >
                    VIEW PROJECT
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {project.members.map((src, i) => (
                      <div
                        key={i}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: '2px solid var(--color-surface)',
                          marginLeft: i === 0 ? 0 : -8,
                        }}
                      >
                        <img
                          src={src}
                          alt="member"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Upload New Project slot */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 240,
                background: 'var(--color-surface)',
                borderRadius: 8,
                border: '1px solid rgba(103, 116, 142, 0.2)',
                gap: 'var(--spacing-3)',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--color-background)',
                }}
              >
                <CloudUpload size={24} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-family-primary)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)' as never,
                  color: 'var(--color-text-primary)',
                }}
              >
                Upload New Project
              </span>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
