export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;

  children?: NavigationItem[];
}
export const NavigationItems: NavigationItem[] = [
  {
    id: 'navigation',
    title: 'Navigation',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'item',
        url: '/dashboard',
        icon: 'feather icon-home',
        classes: 'nav-item'
      }
    ]
  },
  {
    id: 'users',
    title: 'Users',
    type: 'group',
    icon: 'feather icon-users',
    children: [
      {
        id: 'users',
        title: 'Users',
        type: 'item',
        url: '/users',
        classes: 'nav-item',
        icon: 'feather icon-users'
      }
    ]
  },
  {
    id: 'plans-group',
    title: 'Planes',
    type: 'group',
    icon: 'feather icon-package',
    children: [
      { id: 'plans', title: 'Gestión de Planes', type: 'item', url: '/plans', classes: 'nav-item', icon: 'feather icon-package' }
    ]
  },
  {
    id: 'content-group',
    title: 'Contenido',
    type: 'group',
    icon: 'feather icon-layout',
    children: [
      { id: 'landing-config', title: 'Landing Page', type: 'item', url: '/landing-config', classes: 'nav-item', icon: 'feather icon-layout' },
      { id: 'blog-admin', title: 'Blog', type: 'item', url: '/blog-admin', classes: 'nav-item', icon: 'feather icon-edit-3' }
    ]
  },
  {
    id: 'staff-support',
    title: 'Staff Support',
    type: 'group',
    icon: 'feather icon-users',
    children: [
      { id: 'audit-logs', title: 'Audit Logs', type: 'item', url: '/audit-logs', classes: 'nav-item', icon: 'feather icon-activity' },
      { id: 'staff-list', title: 'Staff', type: 'item', url: '/staff', classes: 'nav-item', icon: 'feather icon-user-check' }
    ]
  },
  {
    id: 'transactions-group',
    title: 'Transactions',
    type: 'group',
    icon: 'feather icon-credit-card',
    children: [
      { id: 'holds', title: 'Holds', type: 'item', url: '/holds', classes: 'nav-item', icon: 'feather icon-pause-circle' },
      { id: 'commissions', title: 'Commissions', type: 'item', url: '/commissions', classes: 'nav-item', icon: 'feather icon-award' },
      { id: 'transactions', title: 'All Transactions', type: 'item', url: '/transactions', classes: 'nav-item', icon: 'feather icon-list' }
    ]
  },
  // {
  //   id: 'ui-element',
  //   title: 'UI ELEMENT',
  //   type: 'group',
  //   icon: 'icon-ui',
  //   children: [
  //     {
  //       id: 'basic',
  //       title: 'Component',
  //       type: 'collapse',
  //       icon: 'feather icon-box',
  //       children: [
  //         {
  //           id: 'button',
  //           title: 'Button',
  //           type: 'item',
  //           url: '/basic/button'
  //         },
  //         {
  //           id: 'badges',
  //           title: 'Badges',
  //           type: 'item',
  //           url: '/basic/badges'
  //         },
  //         {
  //           id: 'breadcrumb-pagination',
  //           title: 'Breadcrumb & Pagination',
  //           type: 'item',
  //           url: '/basic/breadcrumb-paging'
  //         },
  //         {
  //           id: 'collapse',
  //           title: 'Collapse',
  //           type: 'item',
  //           url: '/basic/collapse'
  //         },
  //         {
  //           id: 'tabs-pills',
  //           title: 'Tabs & Pills',
  //           type: 'item',
  //           url: '/basic/tabs-pills'
  //         },
  //         {
  //           id: 'typography',
  //           title: 'Typography',
  //           type: 'item',
  //           url: '/basic/typography'
  //         }
  //       ]
  //     }
  //   ]
  // },
  // {
  //   id: 'forms',
  //   title: 'Forms & Tables',
  //   type: 'group',
  //   icon: 'icon-group',
  //   children: [
  //     {
  //       id: 'forms-element',
  //       title: 'Form Elements',
  //       type: 'item',
  //       url: '/forms',
  //       classes: 'nav-item',
  //       icon: 'feather icon-file-text'
  //     },
  //     {
  //       id: 'tables',
  //       title: 'Tables',
  //       type: 'item',
  //       url: '/tables',
  //       classes: 'nav-item',
  //       icon: 'feather icon-server'
  //     }
  //   ]
  // },
  // {
  //   id: 'chart-maps',
  //   title: 'Chart',
  //   type: 'group',
  //   icon: 'icon-charts',
  //   children: [
  //     {
  //       id: 'apexChart',
  //       title: 'ApexChart',
  //       type: 'item',
  //       url: 'apexchart',
  //       classes: 'nav-item',
  //       icon: 'feather icon-pie-chart'
  //     }
  //   ]
  // },
  // {
  //   id: 'pages',
  //   title: 'Pages',
  //   type: 'group',
  //   icon: 'icon-pages',
  //   children: [
  //     {
  //       id: 'auth',
  //       title: 'Authentication',
  //       type: 'collapse',
  //       icon: 'feather icon-lock',
  //       children: [
  //         {
  //           id: 'signup',
  //           title: 'Sign up',
  //           type: 'item',
  //           url: '/register',
  //           target: true,
  //           breadcrumbs: false
  //         },
  //         {
  //           id: 'signin',
  //           title: 'Sign in',
  //           type: 'item',
  //           url: '/login',
  //           target: true,
  //           breadcrumbs: false
  //         }
  //       ]
  //     },
  //     {
  //       id: 'sample-page',
  //       title: 'Sample Page',
  //       type: 'item',
  //       url: '/sample-page',
  //       classes: 'nav-item',
  //       icon: 'feather icon-sidebar'
  //     },
  //     {
  //       id: 'disabled-menu',
  //       title: 'Disabled Menu',
  //       type: 'item',
  //       url: 'javascript:',
  //       classes: 'nav-item disabled',
  //       icon: 'feather icon-power',
  //       external: true
  //     },
  //     {
  //       id: 'buy_now',
  //       title: 'Buy Now',
  //       type: 'item',
  //       icon: 'feather icon-book',
  //       classes: 'nav-item',
  //       url: 'https://codedthemes.com/item/datta-able-angular/',
  //       target: true,
  //       external: true
  //     }
  //   ]
  // }
];
