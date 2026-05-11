import { Routes } from '@angular/router';

export const routes: Routes = [
   { path: '', loadComponent: () => import('./pages/my-network/my-network.component').then(m => m.MyNetworkComponent) },
];
