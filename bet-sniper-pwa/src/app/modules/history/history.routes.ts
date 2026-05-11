
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/transaction-history/transaction-history.component').then(m => m.TransactionHistoryComponent) },
];
