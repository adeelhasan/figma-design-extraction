'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarGroup,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatsCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Avatar,
  Badge,
} from '@/components/ui';
import { statsData, tableData, navigationItems, accountPages } from '@/lib/mock-data';

// Simple icons as SVG components
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
  </svg>
);

const TableIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3 3h18v18H3V3zm2 2v4h4V5H5zm6 0v4h4V5h-4zm6 0v4h4V5h-4zM5 11v4h4v-4H5zm6 0v4h4v-4h-4zm6 0v4h4v-4h-4zM5 17v2h4v-2H5zm6 0v2h4v-2h-4zm6 0v2h4v-2h-4z" />
  </svg>
);

const BillingIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const MoneyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const ClientsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const SalesIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
  </svg>
);

const getNavIcon = (icon: string) => {
  switch (icon) {
    case 'dashboard': return <DashboardIcon />;
    case 'table': return <TableIcon />;
    case 'billing': return <BillingIcon />;
    case 'profile': return <ProfileIcon />;
    default: return <DashboardIcon />;
  }
};

const getStatsIcon = (index: number) => {
  const icons = [<MoneyIcon key="m" />, <UsersIcon key="u" />, <ClientsIcon key="c" />, <SalesIcon key="s" />];
  return icons[index] || icons[0];
};

const iconBackgrounds = [
  'bg-gradient-to-r from-[#7928CA] to-[#FF0080]',
  'bg-gradient-to-r from-[#2152FF] to-[#21D4FD]',
  'bg-gradient-to-r from-[#17AD37] to-[#98EC2D]',
  'bg-gradient-to-r from-[#EA0606] to-[#FF667C]',
];

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      {/* Sidebar */}
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <span className="text-lg font-bold text-[var(--color-primary)]">S</span>
            </div>
            <span className="font-semibold">Soft UI Dashboard</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            {navigationItems.map((item) => (
              <SidebarItem
                key={item.id}
                href={item.href}
                icon={getNavIcon(item.icon)}
                active={item.active}
              >
                {item.label}
              </SidebarItem>
            ))}
          </SidebarGroup>

          <SidebarGroup title="Account Pages">
            {accountPages.map((item) => (
              <SidebarItem
                key={item.id}
                href={item.href}
                icon={getNavIcon(item.icon)}
              >
                {item.label}
              </SidebarItem>
            ))}
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-3">
            <Avatar size="sm" fallback="JD" />
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-white/60">Admin</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm text-[var(--color-text-muted)]">Pages / Dashboard</p>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsData.map((stat, index) => (
            <StatsCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              icon={getStatsIcon(index)}
              iconBackground={iconBackgrounds[index]}
            />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-[var(--color-gray-100)] rounded-lg">
                <p className="text-[var(--color-text-muted)]">Chart placeholder</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-[var(--color-gray-100)] rounded-lg">
                <p className="text-[var(--color-text-muted)]">Chart placeholder</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.company}</TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {row.members.map((_, i) => (
                          <Avatar key={i} size="sm" fallback={`M${i + 1}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{row.budget}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[var(--color-gray-200)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-info)] rounded-full"
                            style={{ width: `${row.completion}%` }}
                          />
                        </div>
                        <span className="text-sm text-[var(--color-text-muted)]">
                          {row.completion}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
