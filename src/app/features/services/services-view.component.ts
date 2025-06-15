import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ServiceService } from '../../core/api/service.service';
import { ServiceOutDto } from '../../core/models/service-out-dto';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-services-view',
  templateUrl: './services-view.component.html',
  styleUrls: ['./services-view.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ServicesViewComponent implements OnInit {
  service: ServiceOutDto | null = null;
  loading = false;
  errorMessage: string | null = null;
  isClient = false;

  constructor(
    private serviceService: ServiceService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadService();
  }

  private checkUserRole(): void {
    const user = this.authService.getCurrentUser();
    this.isClient = user?.role === 'client';
  }

  private loadService(): void {
    this.loading = true;
    this.errorMessage = null;

    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.errorMessage = 'ID de servicio no proporcionado';
      this.loading = false;
      return;
    }

    const serviceId = Number(idParam);
    this.serviceService.getById(serviceId).subscribe({
      next: (data) => {
        this.service = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar el servicio:', err);
        this.errorMessage = 'No se pudo cargar la información del servicio';
        this.loading = false;
      }
    });
  }

  onContractService(): void {
    if (this.service) {
      this.router.navigate(['/services/purchased/new'], {
        queryParams: { serviceId: this.service.serviceId }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/services']);
  }
}
