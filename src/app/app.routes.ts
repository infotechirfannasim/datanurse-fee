import {Routes} from '@angular/router';
import {UnAuthGuard} from "./core/guards/un-auth.guard";
import {AuthGuard} from "./core/guards/auth.guard";
import {PermissionGuard} from "./core/guards/permission.guard";

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
        import('./pages/landing/landing.component').then(
            (m) => m.LandingComponent
        ),
  },
  {
    path: 'delete-account',
    loadComponent: () =>
        import('./pages/delete-acc/delete-account.component')
            .then(m => m.DeleteAccountComponent)
  },
  {
    path: 'auth',
    canActivate: [UnAuthGuard],
    loadChildren: () => import('./pages/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard, PermissionGuard],
    data: {permission: 'DASHBOARD_VIEW'},
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  {
    path: 'users',
    canActivate: [AuthGuard, PermissionGuard],
    data: {permission: 'USER_VIEW'},
    loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: 'roles',
    canActivate: [AuthGuard, PermissionGuard],
    data: {permission: 'ROLE_VIEW'},
    loadComponent: () => import('./pages/roles/roles.component').then(m => m.RolesComponent)
  },

  {
    path: 'doctors',
    canActivate: [AuthGuard, PermissionGuard],
    data: {permission: 'DOCTOR_VIEW'},
    loadComponent: () => import('./pages/doctors/doctors.component').then(m => m.DoctorsComponent)
  },

  {
    path: 'patients',
    canActivate: [AuthGuard, PermissionGuard],
    data: {permission: 'PATIENT_VIEW'},
    loadComponent: () => import('./pages/patient/patient.component').then(m => m.PatientComponent)
  },

  {
    path: 'cases',
    canActivate: [AuthGuard, PermissionGuard],
    data: {permission: 'CASE_VIEW'},
    loadComponent: () => import('./pages/cases/cases.component').then(m => m.CasesComponent)
  },

  {
    path: 'lovs',
    canActivate: [AuthGuard, PermissionGuard],
    data: {permission: 'LOV_VIEW'},
    loadComponent: () => import('./pages/lovs/lov.component').then(m => m.LovComponent)
  },

  {
    path: 'reports',
    canActivate: [AuthGuard, PermissionGuard],
    data: {permission: 'REPORT_VIEW'},
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard, PermissionGuard],
    data: {permission: 'PROFILE_VIEW'},
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
  },

  { path: '**', redirectTo: 'dashboard' }
];
