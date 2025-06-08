import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = 'Usuario';
  showUserMenu = false;
  showMobileMenu = false;
  private authCheckSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar el estado de autenticación inicial
    this.checkAuthStatus();

    // Verificar periódicamente el estado de autenticación (cada 30 segundos)
    this.authCheckSubscription = interval(30000).subscribe(() => {
      this.checkAuthStatus();
    });
  }

  ngOnDestroy(): void {
    // Limpiar la suscripción cuando el componente se destruye
    if (this.authCheckSubscription) {
      this.authCheckSubscription.unsubscribe();
    }
  }

  checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    // Aquí podrías obtener información adicional del usuario si tienes un método para ello
    // Por ejemplo, decodificar el token JWT para obtener el nombre del usuario
    if (this.isLoggedIn) {
      // Si tienes un método para obtener información del usuario, úsalo aquí
      // this.userName = this.getUserNameFromToken() || 'Usuario';
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  closeMobileMenu(): void {
    this.showMobileMenu = false;
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.showUserMenu = false;
    this.isLoggedIn = false;
    this.router.navigate(['/']);
  }

  // Método auxiliar para extraer el nombre del usuario del token JWT (opcional)
  private getUserNameFromToken(): string | null {
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      // Decodificar el token JWT (parte del payload)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.name || payload.sub || null;
    } catch (e) {
      console.error('Error al decodificar el token JWT', e);
      return null;
    }
  }
}
