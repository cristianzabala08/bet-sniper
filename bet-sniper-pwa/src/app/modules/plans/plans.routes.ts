import {  Routes } from '@angular/router';

export const routes: Routes = [
   { path: '', loadComponent: () => import('./pages/plans-selection/plans-selection.component').then(m => m.PlansSelectionComponent) },
];
