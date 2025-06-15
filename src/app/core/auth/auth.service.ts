import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable, tap, BehaviorSubject } from 'rxjs';
  import { environment } from '../../../environments/environment';
  import { jwtDecode } from 'jwt-decode';

  // Definimos la interfaz para la solicitud de inicio de sesion
  interface LoginRequest {
    email: string;
    password: string;
  }

  // Definimos la respuesta que contiene el token JWT
  interface JwtResponse {
    token: string;
    type?: string;
  }

  // Definimos la interfaz para el registro de usuarios
  interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    companyId: number;
    providerId?: number | null;
  }

  // Definimos la estructura del token decodificado
  interface DecodedToken {
    sub: string;
    exp: number;
    iat: number;
    role: string;
    userId: number;
    companyId?: number;
  }

  // Definimos la informacion del usuario
  interface UserInfo {
    email: string;
    role: string;
    userId: number;
    companyId?: number;
  }

  @Injectable({ providedIn: 'root' })
  export class AuthService {
    // Establecemos la URL base para las peticiones de autenticacion
    private baseUrl = `${environment.apiBase}/auth`;
    // Creamos un BehaviorSubject para manejar el usuario actual
    private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
    // Exponemos el observable para que otros componentes puedan suscribirse
    public currentUser = this.currentUserSubject.asObservable();

    // Inyectamos el HttpClient para realizar peticiones
    constructor(private http: HttpClient) {
      // Cargamos el usuario desde el almacenamiento local al inicializar
      this.loadUserFromStorage();
    }

    // Cargamos la informacion del usuario desde el token guardado
    private loadUserFromStorage() {
      const token = this.getToken();
      if (token) {
        try {
          // Decodificamos el token y actualizamos el subject
          const decodedToken = jwtDecode<DecodedToken>(token);
          this.currentUserSubject.next({
            email: decodedToken.sub,
            role: decodedToken.role,
            userId: decodedToken.userId,
            companyId: decodedToken.companyId
          });
        } catch (error) {
          // Manejamos cualquier error en la decodificacion
          console.error('Error loading user from storage:', error);
          this.logout();
        }
      }
    }

    // Autenticamos al usuario y almacenamos su token
    login(dto: LoginRequest): Observable<JwtResponse> {
      return this.http.post<JwtResponse>(`${this.baseUrl}/login`, dto).pipe(
        tap((res) => {
          // Guardamos el token en el almacenamiento local
          localStorage.setItem('token', res.token);
          try {
            // Decodificamos el token y actualizamos el usuario actual
            const decodedToken = jwtDecode<DecodedToken>(res.token);
            this.currentUserSubject.next({
              email: decodedToken.sub,
              role: decodedToken.role,
              userId: decodedToken.userId
            });
          } catch (error) {
            // Registramos cualquier problema con la decodificacion
            console.error('Error decoding token after login:', error);
          }
        })
      );
    }

    // Registramos un nuevo usuario
    register(dto: RegisterRequest): Observable<any> {
      return this.http.post(`${this.baseUrl}/register`, dto);
    }

    // Cerramos la sesion del usuario
    logout(): void {
      localStorage.removeItem('token');
      this.currentUserSubject.next(null);
    }

    // Obtenemos el token del almacenamiento local
    getToken(): string | null {
      return localStorage.getItem('token');
    }

    // Verificamos si el usuario esta autenticado
    isLoggedIn(): boolean {
      const token = this.getToken();
      if (!token) return false;

      try {
        // Comprobamos si el token ha expirado
        const decodedToken = jwtDecode<DecodedToken>(token);
        return decodedToken.exp * 1000 > Date.now();
      } catch (error) {
        console.error('Error checking if logged in:', error);
        return false;
      }
    }

    // Obtenemos el rol del usuario autenticado
    getUserRole(): string | null {
      const token = this.getToken();
      if (!token) return null;

      try {
        // Extraemos el rol del token decodificado
        const decodedToken = jwtDecode<DecodedToken>(token);
        return decodedToken.role;
      } catch (error) {
        console.error('Error getting user role:', error);
        return null;
      }
    }

    // Obtenemos el ID del usuario autenticado
    getUserId(): number | null {
      const token = this.getToken();
      if (!token) return null;

      try {
        // Extraemos el ID del usuario del token
        const decodedToken = jwtDecode<DecodedToken>(token);
        return decodedToken.userId;
      } catch (error) {
        console.error('Error al conseguir la ID del usuario:', error);
        return null;
      }
    }

    // Comprobamos si el usuario tiene un rol especifico
    hasRole(role: string): boolean {
      const userRole = this.getUserRole();
      return userRole === role;
    }

    // Obtenemos la informacion del usuario actual
    getCurrentUser(): UserInfo | null {
      return this.currentUserSubject.value;
    }
  }
