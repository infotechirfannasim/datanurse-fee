import {Routes} from '@angular/router';
import {UnAuthGuard} from "./core/guards/un-auth.guard";
import {AuthGuard} from "./core/guards/auth.guard";

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [UnAuthGuard],
    loadChildren: () => import('./pages/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'doctors',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/doctors/doctors.component').then(m => m.DoctorsComponent)
  },
  {
    path: 'users',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'roles',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/roles/roles.component').then(m => m.RolesComponent)
  },
  {
    path: 'lovs',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/lovs/lov.component').then(m => m.LovComponent)
  },
  {
    path: 'patients',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/patient/patient.component').then(m => m.PatientComponent)
  },
  /*
  {
    path: 'search',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent)
  },
  {
    path: 'reports',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'data',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/data-management/data-management.component').then(m => m.DataManagementComponent)
  },*/
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },
  /*{
    path: 'settings',
    canActivate: [AuthGuard],
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
  },*/
  { path: '**', redirectTo: 'dashboard' }
];
