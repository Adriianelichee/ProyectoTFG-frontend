import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DetailReservationWorkstationService} from '../../../core/api/detail-reservation-workstation.service';
import {DetailReservationWorkstationOutDto} from '../../../core/models/detail-reservation-workstation-out-dto';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-detail-reservations-workstations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detail-reservations-workstations.component.html',
  styleUrl: './detail-reservations-workstations.component.css'
})
export class DetailReservationsWorkstationsComponent implements OnInit {
  detailId: number | null = null;
  detailInfo: DetailReservationWorkstationOutDto | null = null;
  loading = false;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private detailService: DetailReservationWorkstationService
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
    if (!this.detailId) {
      this.errorMessage = 'No hay ID de reserva disponible';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.detailService.getByReservationId(this.detailId).subscribe({
      next: (data) => {
        if (data) {
          this.detailInfo = data;
        } else {
          this.errorMessage = 'No se encontraron detalles para esta reserva';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(`Error al cargar detalles de la reserva ID=${this.detailId}:`, err);
        this.errorMessage = 'No se pudieron cargar los detalles de la reserva';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/reservations']);
  }
}
