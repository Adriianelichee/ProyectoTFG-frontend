import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {PurchasedServiceService} from '../../../core/api/purchased-service.service';
import {ServiceService} from '../../../core/api/service.service';
import {AuthService} from '../../../core/auth/auth.service';
import {catchError, finalize, map, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {PurchasedServiceOutDto} from '../../../core/models/purchased-service-out-dto';
import {ServiceOutDto} from '../../../core/models/service-out-dto';

// Interfaz para la vista combinada
interface PurchasedServiceView {
  purchasedServiceId: number;
  purchaseDate: string;
  expirationDate: string | null;
  serviceId: number;
  companyId: number;
  serviceName: string;
  description: string;
  price: number;
  status?: string; // Calculado basado en fechas
}

@Component({
  selector: 'app-purchased-view',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './purchased-view.component.html',
  styleUrl: './purchased-view.component.css'
})
export class PurchasedViewComponent implements OnInit {
  serviceId: number = 0;
  purchasedService: PurchasedServiceView | null = null;
  loading: boolean = true;
  error: string | null = null;
  isAdminOrSecretary: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchasedServiceService: PurchasedServiceService,
    private serviceService: ServiceService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.isAdminOrSecretary = this.authService.hasRole('admin') || this.authService.hasRole('secretary');

    this.route.params.subscribe(params => {
      this.serviceId = +params['id'];
      this.loadPurchasedService();
    });
  }

  loadPurchasedService(): void {
    this.loading = true;
    this.error = null;

    this.purchasedServiceService.getById(this.serviceId)
      .pipe(
        switchMap((purchasedService: PurchasedServiceOutDto) => {
          // Una vez que tenemos el servicio comprado, obtenemos los detalles del servicio
          return this.serviceService.getById(purchasedService.serviceId).pipe(
            map((serviceDetails: ServiceOutDto) => {
              // Combinamos ambos resultados
              return this.combineServiceData(purchasedService, serviceDetails);
            })
          );
        }),
        catchError(err => {
          this.error = 'Error al cargar los detalles del servicio: ' + (err.message || 'Error desconocido');
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(combinedService => {
        this.purchasedService = combinedService;
      });
  }

  private combineServiceData(purchasedService: PurchasedServiceOutDto, serviceDetails: ServiceOutDto): PurchasedServiceView {
    // Calcular el estado del servicio basado en las fechas
    const now = new Date();
    const purchaseDate = new Date(purchasedService.purchaseDate);
    const expirationDate = purchasedService.expirationDate ? new Date(purchasedService.expirationDate) : null;

    let status = 'active';
    if (expirationDate && expirationDate < now) {
      status = 'completed';
    } else if (purchaseDate > now) {
      status = 'pending';
    }

    // Combinar los datos en un solo objeto
    return {
      purchasedServiceId: purchasedService.purchasedServiceId,
      purchaseDate: purchasedService.purchaseDate,
      expirationDate: purchasedService.expirationDate,
      serviceId: purchasedService.serviceId,
      companyId: purchasedService.companyId,
      serviceName: serviceDetails.serviceName,
      description: serviceDetails.description,
      price: serviceDetails.price,
      status: status
    };
  }

  goBack(): void {
    this.router.navigate(['/services/purchased']);
  }

  getStatusClass(status: string | undefined | null): string {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'pending':
        return 'status-pending';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusLabel(status: string | undefined | null): string {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'active':
        return 'Activo';
      case 'pending':
        return 'Pendiente';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  // Calcular duración en formato legible
  getDuration(): string {
    if (!this.purchasedService || !this.purchasedService.purchaseDate || !this.purchasedService.expirationDate) {
      return 'No disponible';
    }

    const start = new Date(this.purchasedService.purchaseDate);
    const end = new Date(this.purchasedService.expirationDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} días`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 mes' : `${months} meses`;
    }
  }
}
