import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
];


