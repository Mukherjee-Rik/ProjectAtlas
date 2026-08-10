export interface NavigationItem {
  label: string;
  href: string;
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
  },
  {
    label: 'Users',
    href: '/users',
  },
  {
    label: 'Profile',
    href: '/profile',
  },
  {
    label: 'Settings',
    href: '/settings',
  },
];
