// src/app/core/guards/permission.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const PermissionGuard = (route: any) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermission = route.data?.['permission'];

  if (!requiredPermission) {
    return true;
  }

  if (authService.hasPermission(requiredPermission)) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
