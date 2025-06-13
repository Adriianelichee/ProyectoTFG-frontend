import {Injectable} from '@angular/core';
import {CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {AuthService} from './auth.service';

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (!this.authService.isLoggedIn()) {
      return this.router.parseUrl('/auth/login');
    }

    const roles = route.data['roles'] as Array<string>;
    if (roles && roles.length > 0) {
      const hasRequiredRole = roles.some(role => this.authService.hasRole(role));
      if (!hasRequiredRole) {
        return this.router.parseUrl('/');
      }
    }

    return true;
  }
}
