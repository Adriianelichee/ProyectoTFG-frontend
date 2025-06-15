import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// Implementamos un interceptor para manejar tokens JWT en peticiones HTTP
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  // Inyectamos el servicio de autenticacion para acceder al token
  constructor(private authService: AuthService) {}

  // Implementamos el metodo de intercepcion de peticiones
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtenemos el token almacenado si existe
    const token = this.authService.getToken();
    if (token) {
      // Creamos una copia de la peticion con el token en los headers
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      // Enviamos la peticion modificada
      return next.handle(cloned);
    }
    // Continuamos con la peticion original si no hay token
    return next.handle(req);
  }
}
