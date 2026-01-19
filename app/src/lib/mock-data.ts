// Mock data for dashboard
// Replace with real API calls in production

export const statsData = [
  {
    id: 1,
    title: "Today's Money",
    value: '$53,000',
    trend: { value: '55%', positive: true },
  },
  {
    id: 2,
    title: "Today's Users",
    value: '2,300',
    trend: { value: '3%', positive: true },
  },
  {
    id: 3,
    title: 'New Clients',
    value: '+3,462',
    trend: { value: '2%', positive: false },
  },
  {
    id: 4,
    title: 'Sales',
    value: '$103,430',
    trend: { value: '5%', positive: true },
  },
];

export const tableData = [
  {
    id: 1,
    company: 'Spotify',
    members: ['avatar1', 'avatar2', 'avatar3'],
    budget: '$2,500',
    completion: 60,
  },
  {
    id: 2,
    company: 'Invision',
    members: ['avatar1', 'avatar2'],
    budget: '$5,000',
    completion: 100,
  },
  {
    id: 3,
    company: 'Jira',
    members: ['avatar1', 'avatar2', 'avatar3', 'avatar4'],
    budget: '$3,400',
    completion: 30,
  },
  {
    id: 4,
    company: 'Slack',
    members: ['avatar1', 'avatar2'],
    budget: '$1,400',
    completion: 0,
  },
  {
    id: 5,
    company: 'Webdev',
    members: ['avatar1', 'avatar2', 'avatar3'],
    budget: '$14,000',
    completion: 80,
  },
];

export const navigationItems = [
  { id: 1, label: 'Dashboard', href: '/dashboard', icon: 'dashboard', active: true },
  { id: 2, label: 'Tables', href: '/tables', icon: 'table' },
  { id: 3, label: 'Billing', href: '/billing', icon: 'billing' },
  { id: 4, label: 'Profile', href: '/profile', icon: 'profile' },
];

export const accountPages = [
  { id: 1, label: 'Sign In', href: '/signin', icon: 'signin' },
  { id: 2, label: 'Sign Up', href: '/signup', icon: 'signup' },
];
