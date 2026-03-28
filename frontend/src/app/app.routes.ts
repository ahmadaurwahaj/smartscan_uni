import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.LoginComponent)
  },

  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then(m => m.RegisterComponent)
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
  },

  {
    path: 'upload',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/upload/upload').then(m => m.UploadComponent)
  },

  {
    path: 'documents',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/documents/documents').then(m => m.DocumentsComponent)
  },

  {
    path: 'search',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/search/search').then(m => m.SearchComponent)
  },

  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/history/history').then(m => m.HistoryComponent)
  },

  {
    path: 'analysis/:task_id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/analysis/analysis').then(m => m.AnalysisResultComponent)
  },

  { path: '**', redirectTo: '' }

];
