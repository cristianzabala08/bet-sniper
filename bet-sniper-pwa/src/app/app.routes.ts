import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { appChildRoutes } from './modules/modules.routes'; // Asumo que esto ya existe
import { ResetPasswordComponent } from './modules/auth/pages/reset-password/reset-password.component';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  {
    path: 'landing',
    loadChildren: () => import('./modules/landing/landing.routes').then(m => m.landingRoutes),
  },
  {
    path: 'blog',
    loadChildren: () => import('./modules/blog/blog.routes').then(m => m.blogRoutes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.authRoutes),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    children: appChildRoutes,
  },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '**', redirectTo: 'landing' },
];
