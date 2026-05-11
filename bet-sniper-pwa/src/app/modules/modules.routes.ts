import { Routes } from '@angular/router';
import { MainLayoutComponent } from '../core/layout/main-layout/main-layout.component';

export const appChildRoutes: Routes = [
  {
    path: '',
    component: MainLayoutComponent, // <--- AQUÍ ESTÁ LA CLAVE
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.routes').then((m) => m.routes),
      },
      {
        path: 'plans',
        loadChildren: () =>
          import('./plans/plans.routes').then((m) => m.routes),
      },
      {
        path: 'history',
        loadChildren: () =>
          import('./history/history.routes').then((m) => m.routes),
      },
      {
        path: 'referrals',
        loadChildren: () =>
          import('./referrals/referrals.routes').then((m) => m.routes),
      },
      {
        path: 'support',
        loadChildren: () =>
          import('./support/support.routes').then((m) => m.routes),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./profile/profile.routes').then((m) => m.routes),
      },
    ],
  },
];
