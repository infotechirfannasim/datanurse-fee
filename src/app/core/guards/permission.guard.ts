// src/app/core/guards/permission.guard.ts
import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {AuthService} from '../services/auth.service';

export const PermissionGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredPermission = route.data?.['permission'] as string | undefined;
  if (!requiredPermission) {
    return true;
  }
  if (authService.hasPermission(requiredPermission)) {
    return true;
  }
  router.navigate(['/dashboard']);
  return false;
};
