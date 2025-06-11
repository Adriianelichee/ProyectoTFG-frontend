// src/app/core/guards/role.guard.ts
import {Injectable} from '@angular/core';
import {CanActivate, Router, ActivatedRouteSnapshot} from '@angular/router';
import {AuthService} from '../auth/auth.service';

@Injectable({providedIn: 'root'})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    // Verificar si el usuario está autenticado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener roles permitidos de los datos de la ruta
    const requiredRoles = route.data['roles'] as Array<string>;
    const userRole = this.authService.getUserRole();

    // Verificar si el usuario tiene alguno de los roles requeridos
    if (requiredRoles && userRole && requiredRoles.includes(userRole)) {
      return true;
    }

    // Si no tiene el rol adecuado, redirigir a la página de inicio
    this.router.navigate(['/']);
    return false;
  }
}
