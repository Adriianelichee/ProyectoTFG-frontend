import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DetailReservationRoomService} from '../../../core/api/detail-reservation-room.service';
import {DetailReservationRoomOutDto} from '../../../core/models/detail-reservation-room-out-dto';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-detail-reservations-rooms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-reservations-rooms.component.html',
  styleUrl: './detail-reservations-rooms.component.css'
})
export class DetailReservationsRoomsComponent implements OnInit {
  detailId: number | null = null;
  detailInfo: DetailReservationRoomOutDto | null = null;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private detailService: DetailReservationRoomService
  ) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (!idParam) {
        this.errorMessage = 'ID de reserva no válido';
        return;
      }

      this.detailId = parseInt(idParam, 10);
      this.loadDetailInfo();
    });
  }

  loadDetailInfo(): void {
    if (!this.detailId) return;

    this.loading = true;
    this.errorMessage = null;

    this.detailService.getByReservationId(this.detailId).subscribe({
      next: (data) => {
        this.detailInfo = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalles de la reserva:', err);
        this.errorMessage = 'No se pudieron cargar los detalles de la reserva';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/reservations']);
  }
}
