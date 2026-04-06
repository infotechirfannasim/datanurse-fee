// src/app/core/guards/permission.guard.ts
import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {ToastService} from "../services/toast.service";

export const PermissionGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  const requiredPermission = route.data?.['permission'] as string | undefined;
  if (!requiredPermission) {
    return true;
  }
  if (authService.hasPermission(requiredPermission)) {
    return true;
  }
  toastService.show("You don't have permission");
  return false;
};
