import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AuthService} from '../../../core/auth/auth.service';
import {Router} from '@angular/router';
import {Subscription, interval} from 'rxjs';
import {ReservationService} from '../../../core/api/reservation.service';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userHasReservationsOrServices = false;
  isAdmin = false;
  isSecretary = false;
  userName = 'Usuario';
  showUserMenu = false;
  showMobileMenu = false;
  private authCheckSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private reservationService: ReservationService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.checkUserReservationsAndServices();
    // Verificar el estado de autenticación inicial
    this.checkAuthStatus();

    // Verificar periódicamente el estado de autenticación (cada 30 segundos)
    this.authCheckSubscription = interval(30000).subscribe(() => {
      this.checkAuthStatus();
    });
  }

  checkUserReservationsAndServices(): void {
    if (!this.authService.isLoggedIn()) {
      this.userHasReservationsOrServices = false;
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.userHasReservationsOrServices = false;
      return;
    }

    // Verificar si el usuario tiene reservas
    this.reservationService.getByUser(user.userId).subscribe({
      next: (reservations) => {
        this.userHasReservationsOrServices = reservations && reservations.length > 0;
      },
      error: () => {
        this.userHasReservationsOrServices = false;
      }
    });
  }

  scrollToContact(): void {
    setTimeout(() => {
      const contactElement = document.getElementById('contact');
      if (contactElement) {
        contactElement.scrollIntoView({behavior: 'smooth'});
      }
    }, 100); // Pequeño retraso para asegurar que la navegación se complete primero
  }


  ngOnDestroy(): void {
    // Limpiar la suscripción cuando el componente se destruye
    if (this.authCheckSubscription) {
      this.authCheckSubscription.unsubscribe();
    }
  }

  checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    // Si está logueado, verificar si es administrador
    if (this.isLoggedIn) {
      // Verificación de rol admin (asumiendo que hay un método hasRole en AuthService)
      this.isAdmin = this.authService.hasRole('admin');
      this.isSecretary = this.authService.hasRole('secretary');
      // Obtener nombre de usuario si está disponible
      this.userName = this.getUserNameFromToken() || 'Usuario';
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
    this.isAdmin = false; // Resetear el rol de admin al cerrar sesión
    this.router.navigate(['/']);
  }

  // Método auxiliar para extraer el nombre del usuario del token JWT
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
