import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReservationService} from '../../core/api/reservation.service';
import {AuthService} from '../../core/auth/auth.service';
import {ReservationOutDto} from '../../core/models/reservation-out-dto';
import {Router} from '@angular/router';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})
export class ReservationsComponent implements OnInit {
  reservations: ReservationOutDto[] = [];
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage = 'Debe iniciar sesión para ver sus reservas.';
      return;
    }
    this.loading = true;
    this.reservationService.getByUser(user.userId).subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudieron cargar las reservas.';
        this.loading = false;
      }
    });
  }

  verDetalles(reserva: ReservationOutDto) {
    if (reserva.reservationType?.toUpperCase() === 'WORKSTATION') {
      this.router.navigate(['/reservations/workstation', reserva.reservationId]);
    } else if (reserva.reservationType?.toUpperCase() === 'ROOM') {
      this.router.navigate(['/reservations/room', reserva.reservationId]);
    }
  }

}
