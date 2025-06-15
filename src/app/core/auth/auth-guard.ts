import {Injectable} from '@angular/core';
import {CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {AuthService} from './auth.service';

// Creamos un guardia para proteger las rutas que requieren autenticacion
@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {
  // Inyectamos los servicios necesarios para realizar la autenticacion
  constructor(private authService: AuthService, private router: Router) {
  }

  // Implementamos el metodo que decide si la ruta puede activarse
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Verificamos si el usuario tiene sesion activa
    if (!this.authService.isLoggedIn()) {
      // Redirigimos al login si no esta autenticado
      return this.router.parseUrl('/auth/login');
    }

    // Obtenemos los roles permitidos para la ruta actual
    const roles = route.data['roles'] as Array<string>;
    // Comprobamos si hay restricciones de roles definidas
    if (roles && roles.length > 0) {
      // Verificamos si el usuario tiene al menos uno de los roles requeridos
      const hasRequiredRole = roles.some(role => this.authService.hasRole(role));
      // Redirigimos a la pagina principal si no tiene los permisos
      if (!hasRequiredRole) {
        return this.router.parseUrl('/');
      }
    }

    // Permitimos el acceso si todo es correcto
    return true;
  }
}
