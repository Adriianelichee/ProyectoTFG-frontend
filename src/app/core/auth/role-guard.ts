// src/app/core/auth/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const allowedRoles = route.data['roles'] as Array<string>;
    const user = this.authService.getCurrentUser();

    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    // Redirigir a una página de acceso denegado o al inicio
    this.router.navigate(['/']);
    return false;
  }
}
