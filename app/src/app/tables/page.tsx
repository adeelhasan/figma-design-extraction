'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { User, Music, Triangle, Hash, Code, Eye, MoreVertical } from 'lucide-react';

const authorsData = [
  { name: 'Michael John', email: 'michael@mail.com', jobTitle: 'Manager', department: 'Organization', status: 'ONLINE', statusVariant: 'online', employed: '23/04/18' },
  { name: 'Alexa Liras', email: 'alexa@mail.com', jobTitle: 'Programator', department: 'Developer', status: 'OFFLINE', statusVariant: 'offline', employed: '23/12/20' },
  { name: 'Laure Perrier', email: 'laure@mail.com', jobTitle: 'Executive', department: 'Projects', status: 'ONLINE', statusVariant: 'online', employed: '13/04/19' },
  { name: 'Miriam Eric', email: 'miriam@mail.com', jobTitle: 'Marketing', department: 'Organization', status: 'ONLINE', statusVariant: 'online', employed: '03/04/21' },
  { name: 'Richard Gran', email: 'richard@mail.com', jobTitle: 'Manager', department: 'Organization', status: 'OFFLINE', statusVariant: 'offline', employed: '23/03/20' },
  { name: 'John Levi', email: 'john@mail.com', jobTitle: 'Tester', department: 'Developer', status: 'OFFLINE', statusVariant: 'offline', employed: '14/04/17' },
];

const projectsData = [
  { company: 'Spotify Version', logoColor: '#2ebd59', icon: 'music', budget: '$14,000', status: 'working', statusVariant: 'working', completion: 60, completionLabel: '60%', progressGradient: 'var(--gradient-info)' },
  { company: 'Progress Track', logoColor: '#2684ff', icon: 'triangle', budget: '$3,000', status: 'working', statusVariant: 'working', completion: 10, completionLabel: '10%', progressGradient: 'var(--gradient-info)' },
  { company: 'Jira Platform Errors', logoColor: '#36c5f0', icon: 'hash', budget: 'Not Set', status: 'done', statusVariant: 'done', completion: 100, completionLabel: '100%', progressGradient: 'var(--gradient-success)' },
  { company: 'Launch new Mobile App', logoColor: '#2ebd59', icon: 'music', budget: '$20,600', status: 'canceled', statusVariant: 'canceled', completion: 50, completionLabel: '50%', progressGradient: 'var(--gradient-error)' },
  { company: 'Web Dev', logoColor: '#0d55ff', icon: 'code', budget: '$4,000', status: 'working', statusVariant: 'working', completion: 80, completionLabel: '80%', progressGradient: 'var(--gradient-info)' },
  { company: 'Redesign Online Store', logoColor: '#dc395f', icon: 'eye', budget: '$2,000', status: 'canceled', statusVariant: 'canceled', completion: 0, completionLabel: '0%', progressGradient: 'var(--gradient-error)' },
];

const companyIcons: Record<string, React.ReactNode> = {
  music: <Music style={{ width: 12, height: 12, color: 'white' }} />,
  triangle: <Triangle style={{ width: 12, height: 12, color: 'white' }} />,
  hash: <Hash style={{ width: 12, height: 12, color: 'white' }} />,
  code: <Code style={{ width: 12, height: 12, color: 'white' }} />,
  eye: <Eye style={{ width: 12, height: 12, color: 'white' }} />,
};

const statusColorMap: Record<string, string> = {
  working: 'var(--color-info)',
  done: 'var(--color-success)',
  canceled: 'var(--color-error)',
};

export default function TablesPage() {
  return (
    <DashboardLayout>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'auto auto',
          gap: '24px',
        }}
      >
        {/* ─── table-1: Authors Table ─── */}
        <section style={{ gridColumn: '1 / 13', gridRow: '1 / 2' }}>
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '12px',
              boxShadow: '0px 20px 27px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              padding: 'var(--spacing-6)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-6)',
                letterSpacing: 'var(--letter-spacing-tight)',
              }}
            >
              Authors Table
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['AUTHOR', 'FUNCTION', 'STATUS', 'EMPLOYED', ''].map((header, i) => (
                    <th
                      key={i}
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-text-secondary)',
                        textAlign: 'left',
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        borderBottom: '1px solid var(--gray-light-alt)',
                        letterSpacing: 'var(--letter-spacing-tight)',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {authorsData.map((row, idx) => (
                  <tr
                    key={row.email}
                    style={{
                      borderBottom: idx < authorsData.length - 1 ? '1px solid var(--gray-light-alt)' : 'none',
                    }}
                  >
                    {/* Author */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
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
                            borderRadius: 8,
                            background: '#d8d8d8',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <User style={{ width: 16, height: 16, color: 'var(--color-secondary)' }} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: 'var(--font-size-base)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--color-text-primary)',
                              letterSpacing: 'var(--letter-spacing-tight)',
                            }}
                          >
                            {row.name}
                          </div>
                          <div
                            style={{
                              fontFamily: 'var(--font-family-primary)',
                              fontSize: 'var(--font-size-sm)',
                              fontWeight: 'var(--font-weight-regular)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            {row.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Function */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-primary)',
                          letterSpacing: 'var(--letter-spacing-tight)',
                        }}
                      >
                        {row.jobTitle}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {row.department}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px 10px',
                          borderRadius: 8,
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-2xs)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'white',
                          letterSpacing: 'var(--letter-spacing-tight)',
                          background: row.statusVariant === 'online' ? 'var(--gradient-success)' : 'var(--gradient-secondary)',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* Employed */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {row.employed}
                      </span>
                    </td>

                    {/* Edit */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
                      <a
                        href="#"
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-regular)',
                          color: 'var(--color-text-secondary)',
                          textDecoration: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── table-2: Projects Table ─── */}
        <section style={{ gridColumn: '1 / 13', gridRow: '2 / 3' }}>
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: '12px',
              boxShadow: '0px 20px 27px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
              padding: 'var(--spacing-6)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-family-primary)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-6)',
                letterSpacing: 'var(--letter-spacing-tight)',
              }}
            >
              Projects Table
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['COMPANIES', 'BUDGET', 'STATUS', 'COMPLETION', ''].map((header, i) => (
                    <th
                      key={i}
                      style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-text-secondary)',
                        textAlign: 'left',
                        padding: 'var(--spacing-2) var(--spacing-3)',
                        borderBottom: '1px solid var(--gray-light-alt)',
                        letterSpacing: 'var(--letter-spacing-tight)',
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projectsData.map((row, idx) => (
                  <tr
                    key={row.company}
                    style={{
                      borderBottom: idx < projectsData.length - 1 ? '1px solid var(--gray-light-alt)' : 'none',
                    }}
                  >
                    {/* Company */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-3)',
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 'var(--radius-sm)',
                            background: row.logoColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: 14,
                          }}
                        >
                          {companyIcons[row.icon]}
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-text-primary)',
                            letterSpacing: 'var(--letter-spacing-tight)',
                          }}
                        >
                          {row.company}
                        </span>
                      </div>
                    </td>

                    {/* Budget */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-text-primary)',
                          letterSpacing: 'var(--letter-spacing-tight)',
                        }}
                      >
                        {row.budget}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-family-primary)',
                          fontSize: 'var(--font-size-2xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          letterSpacing: 'var(--letter-spacing-tight)',
                          color: statusColorMap[row.statusVariant] || 'var(--color-text-secondary)',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* Completion */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-3)',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-family-primary)',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-regular)',
                            color: 'var(--color-text-primary)',
                            minWidth: 36,
                          }}
                        >
                          {row.completionLabel}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 3,
                            background: 'var(--color-border)',
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            maxWidth: 200,
                          }}
                        >
                          <div
                            style={{
                              width: `${row.completion}%`,
                              height: '100%',
                              borderRadius: 1.5,
                              background: row.progressGradient,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* More dots */}
                    <td style={{ padding: 'var(--spacing-3)', verticalAlign: 'middle' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 3,
                          cursor: 'pointer',
                          padding: 'var(--spacing-1)',
                        }}
                      >
                        <span style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-secondary)' }} />
                        <span style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-secondary)' }} />
                        <span style={{ display: 'block', width: 4, height: 4, borderRadius: '50%', background: 'var(--color-text-secondary)' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
