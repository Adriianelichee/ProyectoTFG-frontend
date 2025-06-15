import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Definimos un guardia para proteger rutas basadas en roles especificos
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  // Inyectamos los servicios que necesitamos para verificar los permisos
  constructor(private authService: AuthService, private router: Router) {}

  // Implementamos el metodo que verifica si puede acceder a la ruta
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Obtenemos los roles permitidos desde la configuracion de la ruta
    const allowedRoles = route.data['roles'] as Array<string>;
    // Recuperamos la informacion del usuario actual
    const user = this.authService.getCurrentUser();

    // Verificamos si el usuario existe y tiene uno de los roles permitidos
    if (user && allowedRoles.includes(user.role)) {
      // Permitimos el acceso si cumple los requisitos
      return true;
    }

    // Redirigimos al inicio si no tiene los permisos adecuados
    this.router.navigate(['/']);
    // Denegamos el acceso a la ruta solicitada
    return false;
  }
}
