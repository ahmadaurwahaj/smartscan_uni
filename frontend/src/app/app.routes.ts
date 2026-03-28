import { Routes } from '@angular/router';

export const routes: Routes = [

{
  path: '',
  loadComponent: () =>
    import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
},

{
  path: 'upload',
  loadComponent: () =>
    import('./features/upload/upload').then(m => m.UploadComponent)
},

{
  path: 'documents',
  loadComponent: () =>
    import('./features/documents/documents').then(m => m.DocumentsComponent)
},

{
  path: 'search',
  loadComponent: () =>
    import('./features/search/search').then(m => m.SearchComponent)
},

{
  path: 'analysis/:task_id',
  loadComponent: () =>
    import('./features/analysis/analysis').then(m => m.AnalysisResultComponent)
}

];