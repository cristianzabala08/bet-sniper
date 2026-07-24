import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'signals', loadComponent: () => import('./pages/signals-list/signals-list.component').then(m => m.SignalsListComponent) },
  { path: 'automatic', loadComponent: () => import('./pages/automatic-mode/automatic-mode.component').then(m => m.AutomaticModeComponent) }
];
