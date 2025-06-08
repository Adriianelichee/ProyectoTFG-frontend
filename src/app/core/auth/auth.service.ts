import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';

interface LoginRequest {
  email: string;
  password: string;
}

interface JwtResponse {
  token: string;
  type?: string;
}

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

interface DecodedToken {
  sub: string;
  exp: number;
  iat: number;
  role: string;
  userId: number; // Añadimos el userId al DecodedToken
  companyId?: number; // Opcional, si es necesario
}

interface UserInfo {
  email: string;
  role: string;
  userId: number; // Añadimos el userId al UserInfo
  companyId?: number; // Opcional, si es necesario
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = `${environment.apiBase}/auth`;
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        this.currentUserSubject.next({
          email: decodedToken.sub,
          role: decodedToken.role,
          userId: decodedToken.userId,
          companyId: decodedToken.companyId// Incluimos el userId
        });
      } catch (error) {
        console.error('Error loading user from storage:', error);
        this.logout();
      }
    }
  }

  login(dto: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.baseUrl}/login`, dto).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
        try {
          const decodedToken = jwtDecode<DecodedToken>(res.token);
          this.currentUserSubject.next({
            email: decodedToken.sub,
            role: decodedToken.role,
            userId: decodedToken.userId // Incluimos el userId
          });
        } catch (error) {
          console.error('Error decoding token after login:', error);
        }
      })
    );
  }

  register(dto: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, dto);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      // Verificar si el token ha expirado
      return decodedToken.exp * 1000 > Date.now();
    } catch (error) {
      console.error('Error checking if logged in:', error);
      return false;
    }
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      return decodedToken.role;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Nuevo método para obtener el ID del usuario
  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const decodedToken = jwtDecode<DecodedToken>(token);
      return decodedToken.userId;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  getCurrentUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }
}
