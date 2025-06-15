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
    this.checkAuthStatus();

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
    }, 100);
  }


  ngOnDestroy(): void {
    if (this.authCheckSubscription) {
      this.authCheckSubscription.unsubscribe();
    }
  }

  checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();

    if (this.isLoggedIn) {
      this.isAdmin = this.authService.hasRole('admin');
      this.isSecretary = this.authService.hasRole('secretary');
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
    this.isAdmin = false;
    this.router.navigate(['/']);
  }

  private getUserNameFromToken(): string | null {
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.name || payload.sub || null;
    } catch (e) {
      console.error('Error al decodificar el token JWT', e);
      return null;
    }
  }
}
