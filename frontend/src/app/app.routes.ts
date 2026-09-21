import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'groups/:groupId',
    loadComponent: () => import('./features/group/group-page').then((m) => m.GroupPage),
  },
  { path: '**', redirectTo: '' },
];
