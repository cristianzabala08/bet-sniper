import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// project import
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { AdminGuard } from './core/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./modules/dashboard/dashboard.component').then((c) => c.DashboardComponent)
      },
      {
        path: 'basic',
        loadChildren: () => import('./modules/ui-elements/ui-basic/ui-basic.module').then((m) => m.UiBasicModule)
      },
      {
        path: 'forms',
        loadComponent: () => import('./modules/pages/form-element/form-element').then((c) => c.FormElement)
      },
      {
        path: 'tables',
        loadComponent: () => import('./modules/pages/tables/tbl-bootstrap/tbl-bootstrap.component').then((c) => c.TblBootstrapComponent)
      },
      {
        path: 'apexchart',
        loadComponent: () => import('./modules/pages/core-chart/apex-chart/apex-chart.component').then((c) => c.ApexChartComponent)
      },
      {
        path: 'sample-page',
        loadComponent: () => import('./modules/extra/sample-page/sample-page.component').then((c) => c.SamplePageComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./modules/pages/users/users.component').then((c) => c.UsersComponent)
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./modules/pages/users/user-details/user-details.component').then((c) => c.UserDetailsComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./modules/pages/audit-logs/audit-logs.component').then((c) => c.AuditLogsComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./modules/pages/staff/staff.component').then((c) => c.StaffComponent)
      },
      {
        path: 'holds',
        loadComponent: () => import('./modules/pages/holds/holds.component').then((c) => c.HoldsComponent)
      },
      {
        path: 'commissions',
        loadComponent: () =>
          import('./modules/pages/commissions-admin/commissions-admin.component').then((c) => c.CommissionsAdminComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./modules/pages/profile/profile.component').then((c) => c.ProfileComponent)
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./modules/pages/transactions-admin/transactions-admin.component').then((c) => c.TransactionsAdminComponent)
      },
      {
        path: 'plans',
        loadComponent: () => import('./modules/pages/plans/plans.component').then((c) => c.PlansComponent)
      },
      {
        path: 'landing-config',
        loadComponent: () => import('./modules/pages/landing-config/landing-config.component').then((c) => c.LandingConfigComponent)
      },
      {
        path: 'blog-admin',
        loadComponent: () => import('./modules/pages/blog-admin/blog-admin.component').then((c) => c.BlogAdminComponent)
      }
    ]
  },
  {
    path: '',
    component: GuestComponent,
    children: [
      {
        path: 'admin/login',
        loadComponent: () => import('./modules/pages/authentication/admin-login/admin-login.component').then((c) => c.AdminLoginComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
